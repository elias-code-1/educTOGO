import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const MAX_RPD = 20;

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export async function getRemainingRPD(uid: string): Promise<number> {
  const today = getTodayString();
  const quotaRef = doc(db, 'users', uid, 'settings', 'gemini_quota');
  const quotaDoc = await getDoc(quotaRef);

  if (quotaDoc.exists()) {
    const data = quotaDoc.data();
    if (data.date !== today) {
      await updateDoc(quotaRef, { usedToday: 0, date: today, lastUpdated: serverTimestamp() });
      return MAX_RPD;
    } else {
      return Math.max(0, MAX_RPD - (data.usedToday || 0));
    }
  } else {
    await setDoc(quotaRef, { usedToday: 0, date: today, lastUpdated: serverTimestamp() }, { merge: true });
    return MAX_RPD;
  }
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

export async function isQuotaExhausted(uid: string): Promise<boolean> {
  const remaining = await getRemainingRPD(uid);
  return remaining <= 0;
}

export function subscribeToQuota(uid: string, callback: (remaining: number) => void): () => void {
  const quotaRef = doc(db, 'users', uid, 'settings', 'gemini_quota');
  const today = getTodayString();

  return onSnapshot(quotaRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(MAX_RPD);
      return;
    }
    const data = docSnap.data();
    if (data.date !== today) {
      callback(MAX_RPD);
    } else {
      callback(Math.max(0, MAX_RPD - (data.usedToday || 0)));
    }
  });
}
