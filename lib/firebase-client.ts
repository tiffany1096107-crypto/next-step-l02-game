'use client';

import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

type CloudGameRecord = {
  id: string;
  studentCode: string;
  completedAt: string;
  scenarioOrder: string[];
  responses: unknown[];
  finalMetrics: Record<string, number>;
  resultTitle: string;
};

export async function syncGameRecordToFirebase(record: CloudGameRecord) {
  if (!isConfigured) return { status: 'local-only' as const };

  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    if (!auth.currentUser) await signInAnonymously(auth);
    if (!auth.currentUser) return { status: 'failed' as const };

    await setDoc(doc(getFirestore(app), 'gameRecords', record.id), {
      ...record,
      submittedBy: auth.currentUser.uid,
      schemaVersion: 1,
      createdAt: serverTimestamp(),
    });
    return { status: 'synced' as const };
  } catch {
    // The local browser copy remains available if Firebase is offline or not enabled yet.
    return { status: 'failed' as const };
  }
}

