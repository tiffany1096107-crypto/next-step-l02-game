'use client';

import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInAnonymously,
  signInWithPopup, signOut, type User,
} from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query,
  serverTimestamp, setDoc, writeBatch,
} from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain &&
  firebaseConfig.projectId && firebaseConfig.appId,
);

const getServices = () => {
  if (!isFirebaseConfigured) throw new Error('Firebase 尚未設定。');
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return { auth: getAuth(app), db: getFirestore(app) };
};

export type CloudGameRecord = {
  id: string;
  studentCode: string;
  completedAt: string;
  scenarioOrder: string[];
  responses: unknown[];
  finalMetrics: Record<string, number>;
  resultTitle: string;
};

export type TeacherIdentity = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
};

export type TeacherSession = TeacherIdentity & {
  status: 'admin' | 'teacher' | 'pending' | 'none';
};

export type TeacherRequest = TeacherIdentity & {
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: Date;
};

const identityFromUser = (user: User): TeacherIdentity => ({
  uid: user.uid,
  email: user.email ?? '',
  displayName: user.displayName ?? user.email?.split('@')[0] ?? '教師',
  ...(user.photoURL ? { photoURL: user.photoURL } : {}),
});

export function watchTeacherAuth(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(getServices().auth, callback);
}

export async function ensureAnonymousSession() {
  if (!isFirebaseConfigured) return null;
  const { auth } = getServices();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}

export async function signInTeacherWithGoogle() {
  const { auth } = getServices();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  return getTeacherSession(credential.user);
}

export async function signOutTeacher() {
  if (!isFirebaseConfigured) return;
  await signOut(getServices().auth);
}

export async function getTeacherSession(user: User): Promise<TeacherSession> {
  const identity = identityFromUser(user);
  if (!identity.email || user.isAnonymous) return { ...identity, status: 'none' };
  const { db } = getServices();
  const [adminDoc, accessDoc, requestDoc] = await Promise.all([
    getDoc(doc(db, 'adminEmails', identity.email.toLowerCase())),
    getDoc(doc(db, 'teacherAccess', identity.uid)),
    getDoc(doc(db, 'teacherRequests', identity.uid)),
  ]);
  const status = adminDoc.exists()
    ? 'admin'
    : accessDoc.exists()
      ? 'teacher'
      : requestDoc.data()?.status === 'pending'
        ? 'pending'
        : 'none';
  return { ...identity, status };
}

export async function submitTeacherRequest() {
  const user = getServices().auth.currentUser;
  if (!user) throw new Error('請先使用 Google 帳號登入。');
  const identity = identityFromUser(user);
  if (!identity.email || user.isAnonymous) throw new Error('請先使用 Google 帳號登入。');
  await setDoc(doc(getServices().db, 'teacherRequests', identity.uid), {
    uid: identity.uid,
    email: identity.email.toLowerCase(),
    displayName: identity.displayName,
    photoURL: identity.photoURL ?? '',
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
  return { ...identity, status: 'pending' as const };
}

export async function loadTeacherRequests(): Promise<TeacherRequest[]> {
  const snapshot = await getDocs(query(
    collection(getServices().db, 'teacherRequests'), orderBy('requestedAt', 'desc'), limit(100),
  ));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      uid: data.uid, email: data.email, displayName: data.displayName,
      ...(data.photoURL ? { photoURL: data.photoURL } : {}),
      status: data.status, requestedAt: data.requestedAt?.toDate?.(),
    } as TeacherRequest;
  });
}

export async function batchReviewTeacherRequests(uids: string[], decision: 'approved' | 'rejected') {
  if (!uids.length) return;
  const { auth, db } = getServices();
  if (!auth.currentUser) throw new Error('請重新登入。');
  const requestSnapshots = await Promise.all(uids.map((uid) => getDoc(doc(db, 'teacherRequests', uid))));
  const batch = writeBatch(db);
  requestSnapshots.forEach((snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    batch.update(snapshot.ref, {
      status: decision, reviewedAt: serverTimestamp(), reviewedBy: auth.currentUser!.uid,
    });
    const accessRef = doc(db, 'teacherAccess', data.uid);
    if (decision === 'approved') {
      batch.set(accessRef, {
        uid: data.uid, email: data.email, displayName: data.displayName, role: 'teacher',
        approvedAt: serverTimestamp(), approvedBy: auth.currentUser!.uid,
      });
    } else {
      batch.delete(accessRef);
    }
  });
  await batch.commit();
}

export async function loadCloudGameRecords(): Promise<CloudGameRecord[]> {
  const snapshot = await getDocs(query(
    collection(getServices().db, 'gameRecords'), orderBy('createdAt', 'desc'), limit(500),
  ));
  return snapshot.docs.map((item) => item.data() as CloudGameRecord);
}

export async function loadCloudSettings() {
  const snapshot = await getDoc(doc(getServices().db, 'publicSettings', 'game'));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    enabledIds: Array.isArray(data.enabledIds) ? data.enabledIds as string[] : [],
    requiredId: typeof data.requiredId === 'string' ? data.requiredId : '',
  };
}

export async function saveCloudSettings(enabledIds: string[], requiredId: string) {
  const { auth, db } = getServices();
  if (!auth.currentUser) throw new Error('請重新登入。');
  await setDoc(doc(db, 'publicSettings', 'game'), {
    enabledIds, requiredId, updatedBy: auth.currentUser.uid, updatedAt: serverTimestamp(),
  });
}

export async function syncGameRecordToFirebase(record: CloudGameRecord) {
  if (!isFirebaseConfigured) return { status: 'local-only' as const };
  try {
    const { auth, db } = getServices();
    if (!auth.currentUser) await signInAnonymously(auth);
    if (!auth.currentUser) return { status: 'failed' as const };
    const serializableRecord = JSON.parse(JSON.stringify(record)) as CloudGameRecord;
    await setDoc(doc(db, 'gameRecords', record.id), {
      ...serializableRecord, submittedBy: auth.currentUser.uid, schemaVersion: 1, createdAt: serverTimestamp(),
    });
    return { status: 'synced' as const };
  } catch {
    return { status: 'failed' as const };
  }
}
