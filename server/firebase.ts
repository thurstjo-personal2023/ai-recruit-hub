import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({
  projectId: "demo-airecruiterhub",
});

export const auth = getAuth(app);
export const db = getFirestore(app);

if (process.env.NODE_ENV === "development") {
  process.env["FIREBASE_AUTH_EMULATOR_HOST"] = "127.0.0.1:9099";
  process.env["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:8080";
}
