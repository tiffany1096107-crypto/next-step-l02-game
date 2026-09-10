import { readFileSync } from 'node:fs';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, '')];
    }),
);

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);
const testId = 'SMOKE-FIREBASE-RULES-20260910';
let ownReadDenied = false;

await signInAnonymously(auth);
await setDoc(doc(db, 'gameRecords', testId), {
  id: testId,
  studentCode: 'TEST-01',
  completedAt: new Date().toISOString(),
  scenarioOrder: ['S01', 'S02', 'S03'],
  responses: [{}, {}, {}],
  finalMetrics: { think: 50, safe: 50, responsibility: 50 },
  resultTitle: '規則測試',
  submittedBy: auth.currentUser.uid,
  schemaVersion: 1,
  createdAt: serverTimestamp(),
});

try {
  await getDoc(doc(db, 'gameRecords', testId));
} catch (error) {
  ownReadDenied = error?.code === 'permission-denied';
}

const settings = await getDoc(doc(db, 'publicSettings', 'game'));
console.log(JSON.stringify({ testId, studentCreate: true, ownReadDenied, settingsReadable: settings.exists() }));
await deleteApp(app);

if (!ownReadDenied || !settings.exists()) process.exitCode = 1;
