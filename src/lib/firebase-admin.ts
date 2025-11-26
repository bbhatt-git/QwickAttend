
import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    app = admin.apps[0];
    return app;
  }
  
  // These credentials will be auto-populated by the App Hosting environment.
  // For local development, you need to set up Application Default Credentials.
  // https://cloud.google.com/docs/authentication/provide-credentials-adc
  const credential = admin.credential.applicationDefault();
  
  app = admin.initializeApp({
    credential,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
  
  return app;
}

export function getFirebaseAdmin() {
  if (!app) {
    initializeAdminApp();
  }
  
  if (!app) {
    throw new Error("Firebase Admin SDK initialization failed.");
  }
  
  return {
    auth: admin.auth(app),
    db: admin.firestore(app),
    storage: admin.storage(app),
  };
}
