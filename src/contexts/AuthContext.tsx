import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  AuthError
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CURRICULUM } from '../data/curriculum';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return "Utilisateur introuvable.";
    case 'auth/wrong-password':
      return "Mot de passe incorrect.";
    case 'auth/email-already-in-use':
      return "Cet email est déjà utilisé.";
    case 'auth/network-request-failed':
      return "Erreur réseau, vérifiez votre connexion.";
    case 'auth/invalid-email':
      return "Format d'email invalide.";
    case 'auth/weak-password':
      return "Le mot de passe est trop court.";
    case 'auth/popup-closed-by-user':
      return "La fenêtre de connexion a été fermée.";
    default:
      return `Une erreur est survenue : ${error.message}`;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Start initialization but don't block the UI
        initializeUserData(currentUser).catch(err => {
          console.error("Failed to initialize user data:", err);
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const initializeUserData = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Élève',
          photoURL: user.photoURL,
          createdAt: serverTimestamp()
        });
      }

      // Check if subjects are already initialized to avoid redundant writes
      const firstSubjectRef = doc(db, 'users', user.uid, 'subjects', CURRICULUM[0].id);
      const firstSubjectSnap = await getDoc(firstSubjectRef);
      
      if (!firstSubjectSnap.exists()) {
        console.log("Initializing curriculum for new user...");
        
        // Use batches to speed up initialization (max 500 operations per batch)
        const { writeBatch } = await import('firebase/firestore');
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const subject of CURRICULUM) {
          const subjectRef = doc(db, 'users', user.uid, 'subjects', subject.id);
          batch.set(subjectRef, {
            name: subject.name,
            coefficient: subject.coefficient,
            grade: 0,
            totalChapters: subject.chapters.length,
            completedChapters: 0,
            color: subject.color,
            icon: subject.icon
          });
          operationCount++;

          for (let i = 0; i < subject.chapters.length; i++) {
            const chapterTitle = subject.chapters[i];
            const chapterRef = doc(db, 'users', user.uid, 'subjects', subject.id, 'chapters', `chap_${i}`);
            batch.set(chapterRef, {
              title: chapterTitle,
              status: 'pending'
            });
            operationCount++;

            // Commit batch if it reaches 400 operations (safe limit)
            if (operationCount >= 400) {
              await batch.commit();
              batch = writeBatch(db);
              operationCount = 0;
            }
          }
        }

        if (operationCount > 0) {
          await batch.commit();
        }
        console.log("Curriculum initialized successfully.");
      }
    } catch (error) {
      console.error("Error in initializeUserData:", error);
      // We don't use handleFirestoreError here to avoid blocking the app with a JSON error
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err) {
      setError(getErrorMessage(err as AuthError));
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setError(getErrorMessage(err as AuthError));
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setError(getErrorMessage(err as AuthError));
      throw err;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, error,
      signInWithGoogle, signInWithEmail, signUpWithEmail, logOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
