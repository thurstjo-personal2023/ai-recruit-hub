import { auth } from "@shared/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";

export async function register(email: string, password: string) {
  try {
    console.log("Attempting to register user with email:", email);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Successfully registered user:", result.user.uid);
    return result;
  } catch (error: any) {
    console.error("Firebase registration error:", error);
    throw new Error(error.message || "Failed to register");
  }
}

export async function login(email: string, password: string) {
  try {
    console.log("Attempting to login user with email:", email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Successfully logged in user:", result.user.uid);
    return result;
  } catch (error: any) {
    console.error("Firebase login error:", error);
    throw new Error(error.message || "Failed to login");
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    console.log("Successfully logged out user");
  } catch (error: any) {
    console.error("Firebase logout error:", error);
    throw new Error(error.message || "Failed to logout");
  }
}