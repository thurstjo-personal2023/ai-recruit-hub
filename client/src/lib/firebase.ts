import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  dataConnectServiceId: "airecruithub-data-connect"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);

  // Configure Data Connect emulator
  const dataConnectConfig = {
    host: '127.0.0.1',
    port: 9399,
    dataSource: 'airecruithub-cloud-sql'
  };

  // Add emulator configuration to window for Data Connect
  window.FIREBASE_EMULATORS = {
    ...window.FIREBASE_EMULATORS,
    dataConnect: dataConnectConfig
  };
}

export { auth, db, storage };