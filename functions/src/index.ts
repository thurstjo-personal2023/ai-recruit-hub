import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Send welcome email when a new user is created
export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const { email, displayName } = user;
  
  if (!email) return;

  try {
    await admin.firestore().collection("mail").add({
      to: email,
      template: {
        name: "welcome",
        data: {
          name: displayName || "there",
        },
      },
    });

    await admin.firestore().collection("analytics").add({
      event: "welcome_email_sent",
      userId: user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
});

// Track registration progress
export const trackRegistrationProgress = functions.firestore
  .document("registrationProgress/{userId}")
  .onWrite(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();
    
    if (!after) return;

    // Only track completed registrations
    if (after.completed && (!before || !before.completed)) {
      await admin.firestore().collection("analytics").add({
        event: "registration_completed",
        userId: context.params.userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          steps: after.lastStep,
          mfaEnabled: after.enableMfa,
          timeToComplete: after.timestamp - (before?.timestamp || after.timestamp),
        },
      });
    }
  });

// Handle MFA enrollment analytics
export const trackMfaEnrollment = functions.auth.user().beforeUpdate(async (change) => {
  const before = change.before;
  const after = change.after;
  
  // Check if MFA was just enabled
  const mfaEnabledNow = after.multiFactor?.enrolledFactors.length && !before.multiFactor?.enrolledFactors.length;
  
  if (mfaEnabledNow) {
    await admin.firestore().collection("analytics").add({
      event: "mfa_enabled",
      userId: after.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: {
        method: after.multiFactor?.enrolledFactors[0].factorId,
      },
    });
  }
});

// Clean up registration progress after completion
export const cleanupRegistrationProgress = functions.firestore
  .document("analytics/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    if (data.event === "registration_completed") {
      try {
        // Delete registration progress after 24 hours
        await new Promise(resolve => setTimeout(resolve, 86400000));
        await admin.firestore().collection("registrationProgress").doc(data.userId).delete();
      } catch (error) {
        console.error("Error cleaning up registration progress:", error);
      }
    }
  });
