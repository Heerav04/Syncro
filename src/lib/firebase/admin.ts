import { getApps, initializeApp, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isFirebaseAdminConfigured() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      clientEmail &&
      privateKey &&
      !clientEmail.includes('YOUR_FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL') &&
      !privateKey.includes('YOUR_FIREBASE_PRIVATE_KEY_HERE')
  );
}

function createAdminApp(): App {
  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey && isFirebaseAdminConfigured()) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  if (projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  requiredEnv('FIREBASE_PROJECT_ID');
  requiredEnv('FIREBASE_CLIENT_EMAIL');
  requiredEnv('FIREBASE_PRIVATE_KEY');

  throw new Error('Firebase Admin SDK could not be initialized.');
}

export function getAdminServices() {
  const app = createAdminApp();

  return {
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app),
  };
}
