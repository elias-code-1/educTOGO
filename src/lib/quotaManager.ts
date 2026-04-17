import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// ==== MULTI-KEY QUOTA ROTATION LOGIC ====

// 1. Lire la liste de clés depuis l'environnement
export function getGeminiKeys(): string[] {
  const keysString = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
  const keys = keysString.split(',').map(k => k.trim()).filter(Boolean);
  
  if (keys.length === 0) {
    console.error("⚠️ ERREUR CRITIQUE : Aucune clé Gemini (VITE_GEMINI_API_KEYS) n'a été trouvée dans l'environnement !");
  } else {
    // Affiche juste le nombre de clés chargées pour vérifier que ça marche, sans exposer la valeur complète
    console.log(`✅ quotaManager: ${keys.length} clées Gemini chargées depuis l'environnement.`);
  }
  
  return keys;
}

// 2. Capacités Pures des Clés
export const MAX_RPD_PER_KEY = 1500;
export const TOTAL_KEYS = Math.max(1, getGeminiKeys().length);
export const MAX_GLOBAL_RPD = MAX_RPD_PER_KEY * TOTAL_KEYS;

// 3. Limites par types d'utilisateurs
const ADMIN_EMAIL = 'contact.logonova@gmail.com';
const STANDARD_USER_LIMIT = 300; 

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Détermine le quota maximal autorisé pour un utilisateur spécifique
export async function getMaxQuotaForUser(uid: string): Promise<number> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    if (data.email === ADMIN_EMAIL || data.role === 'admin') {
      return MAX_GLOBAL_RPD; // L'admin a accès à tout le pool des clés
    }
  }
  return Math.min(STANDARD_USER_LIMIT, MAX_GLOBAL_RPD); // Les potes sont bloqués à 300
}

/** Renvoie directement combien a été utilisé au total aujourd'hui */
export async function getTotalUsed(uid: string): Promise<number> {
  const today = getTodayString();
  const quotaRef = doc(db, 'users', uid, 'settings', 'gemini_quota');
  const quotaDoc = await getDoc(quotaRef);

  if (quotaDoc.exists()) {
    const data = quotaDoc.data();
    if (data.date !== today) {
      await updateDoc(quotaRef, { usedToday: 0, date: today, lastUpdated: serverTimestamp() });
      return 0;
    } else {
      return data.usedToday || 0;
    }
  } else {
    await setDoc(quotaRef, { usedToday: 0, date: today, lastUpdated: serverTimestamp() }, { merge: true });
    return 0;
  }
}

// Garder la rétrocompatibilité (Renvoie le quota restant pour L'UTILISATEUR)
export async function getRemainingRPD(uid: string): Promise<number> {
  const used = await getTotalUsed(uid);
  const maxAllowed = await getMaxQuotaForUser(uid);
  return Math.max(0, maxAllowed - used);
}

export async function incrementRPD(uid: string, count: number = 1): Promise<void> {
  const today = getTodayString();
  const quotaRef = doc(db, 'users', uid, 'settings', 'gemini_quota');
  const quotaDoc = await getDoc(quotaRef);

  if (quotaDoc.exists()) {
    const data = quotaDoc.data();
    if (data.date !== today) {
      await updateDoc(quotaRef, { usedToday: count, date: today, lastUpdated: serverTimestamp() });
    } else {
      await updateDoc(quotaRef, { usedToday: (data.usedToday || 0) + count, lastUpdated: serverTimestamp() });
    }
  } else {
    await setDoc(quotaRef, { usedToday: count, date: today, lastUpdated: serverTimestamp() }, { merge: true });
  }
}

/** 
 * Force le passage à la clé suivante en augmentant artificiellement 
 * le "usedToday" jusqu'au multiple supérieur de MAX_RPD_PER_KEY 
 */
export async function forceSkipToNextKey(uid: string): Promise<void> {
   const used = await getTotalUsed(uid);
   const currentKeyIndex = Math.min(Math.floor(used / MAX_RPD_PER_KEY), TOTAL_KEYS - 1);
   const nextBoundary = (currentKeyIndex + 1) * MAX_RPD_PER_KEY;
   
   if (used < nextBoundary && nextBoundary <= MAX_GLOBAL_RPD) {
       const amountToSkip = nextBoundary - used;
       await incrementRPD(uid, amountToSkip);
   }
}

export async function isQuotaExhausted(uid: string): Promise<boolean> {
  const remaining = await getRemainingRPD(uid);
  return remaining <= 0;
}

export interface QuotaStats {
  globalRemaining: number;
  activeKeyIndex: number; 
  totalKeys: number;
  currentKeyRemaining: number;
  isUnlimited: boolean; // Renommé textuellement pour simplifier
}

export function subscribeToQuotaStats(uid: string, callback: (stats: QuotaStats) => void): () => void {
  const quotaRef = doc(db, 'users', uid, 'settings', 'gemini_quota');
  const today = getTodayString();
  
  let currentUsedToday = 0;
  
  // Fonction pour notifier l'UI avec l'état actuel
  const notify = async () => {
    let maxAllowed = STANDARD_USER_LIMIT;
    let isAdmin = false;

    // Récupérer le rôle (on pourrait mettre en cache cela, mais pour la précision)
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.email === ADMIN_EMAIL || data.role === 'admin') {
        maxAllowed = MAX_GLOBAL_RPD;
        isAdmin = true;
      }
    }

    const remainingForDisplay = Math.max(0, maxAllowed - currentUsedToday);
    const activeKeyIndex = Math.min(Math.floor(currentUsedToday / MAX_RPD_PER_KEY), TOTAL_KEYS - 1);
    
    let currentKeyRemaining = 0;
    if (currentUsedToday < MAX_GLOBAL_RPD) {
        currentKeyRemaining = MAX_RPD_PER_KEY - (currentUsedToday % MAX_RPD_PER_KEY);
    }

    callback({
      globalRemaining: remainingForDisplay,
      activeKeyIndex: activeKeyIndex,
      totalKeys: TOTAL_KEYS,
      currentKeyRemaining: currentKeyRemaining,
      isUnlimited: isAdmin
    });
  };

  return onSnapshot(quotaRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.date === today) {
        currentUsedToday = data.usedToday || 0;
      } else {
        currentUsedToday = 0;
      }
    } else {
      currentUsedToday = 0;
    }
    notify();
  });
}
