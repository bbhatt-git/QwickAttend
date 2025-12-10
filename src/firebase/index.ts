
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

let persistenceEnabled = false;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // Pass the config object here
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Initialization with config object failed.', e);
      }
      // This fallback is less likely to be needed now but kept for safety.
      firebaseApp = initializeApp({});
    }
    
    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  if (!persistenceEnabled) {
    enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Firestore persistence failed to enable. This is likely because multiple tabs are open.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence.');
        }
    });
    persistenceEnabled = true;
  }
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
