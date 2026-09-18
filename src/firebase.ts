import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PlayerStats, PlayerLoadout } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export interface CloudUserData {
  id: string;
  email: string | null;
  displayName: string;
  stats: PlayerStats;
  loadout?: PlayerLoadout;
  updatedAt: any;
}

export async function syncUserDataToCloud(
  user: FirebaseUser,
  stats: PlayerStats,
  loadout?: PlayerLoadout
): Promise<void> {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const data: Record<string, any> = {
    id: user.uid,
    email: user.email,
    displayName: user.displayName || stats.username,
    stats,
    updatedAt: serverTimestamp()
  };
  if (loadout) {
    data.loadout = loadout;
  }
  await setDoc(userRef, data, { merge: true });
}

export async function loadUserDataFromCloud(
  uid: string
): Promise<{ stats?: PlayerStats; loadout?: PlayerLoadout; displayName?: string } | null> {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      stats: data.stats as PlayerStats | undefined,
      loadout: data.loadout as PlayerLoadout | undefined,
      displayName: data.displayName as string | undefined
    };
  }
  return null;
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
};
export type { FirebaseUser };
