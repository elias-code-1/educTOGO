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
        await initializeUserData(currentUser);
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

      for (const subject of CURRICULUM) {
        const subjectRef = doc(db, 'users', user.uid, 'subjects', subject.id);
        const subjectSnap = await getDoc(subjectRef);
        
        if (!subjectSnap.exists()) {
          await setDoc(subjectRef, {
            name: subject.name,
            coefficient: subject.coefficient,
            grade: 0,
            totalChapters: subject.chapters.length,
            completedChapters: 0,
            color: subject.color,
            icon: subject.icon
          });

          for (let i = 0; i < subject.chapters.length; i++) {
            const chapterTitle = subject.chapters[i];
            const chapterRef = doc(db, 'users', user.uid, 'subjects', subject.id, 'chapters', `chap_${i}`);
            await setDoc(chapterRef, {
              title: chapterTitle,
              status: 'pending'
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
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
