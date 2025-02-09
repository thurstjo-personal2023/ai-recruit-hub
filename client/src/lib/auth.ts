import { auth } from "@shared/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";

export async function register(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}
