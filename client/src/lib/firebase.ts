import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  // Auth emulator
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

  // Firestore emulator
  connectFirestoreEmulator(db, '127.0.0.1', 8080);

  // Functions emulator
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);

  // Storage emulator
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export { auth, db, functions, storage };