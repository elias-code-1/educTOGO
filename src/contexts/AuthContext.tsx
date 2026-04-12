import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CURRICULUM } from '../data/curriculum';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        // Create user profile
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Élève',
          photoURL: user.photoURL,
          createdAt: serverTimestamp()
        });
      }

      // Always sync subjects to ensure existing users get new subjects (like ECM)
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
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithApple = async () => {
    const provider = new OAuthProvider('apple.com');
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    // Validation basique
    if (email.length < 5) {
      throw new Error('L\'email doit contenir au moins 5 caractères.');
    }
    if (pass.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    }
    
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      // Gestion spécifique des erreurs Firebase
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Cet email est déjà utilisé. Essaye un autre email ou connecte-toi.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Format d\'email invalide.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Le mot de passe est trop faible (minimum 6 caractères).');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('La création de compte est désactivée.');
      } else {
        throw new Error(error.message || 'Erreur lors de la création du compte.');
      }
    }
  };

  const setupRecaptcha = (containerId: string) => {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
  };

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, 
      signInWithGoogle, signInWithGithub, signInWithFacebook, signInWithApple,
      signInWithEmail, signUpWithEmail, setupRecaptcha, signInWithPhone, logOut 
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
