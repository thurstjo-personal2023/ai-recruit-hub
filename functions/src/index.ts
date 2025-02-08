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

// Track registration progress and handle MFA enrollment
export const trackMfaEnrollment = functions.auth.user().beforeUpdate(async (change) => {
  const before = change.before;
  const after = change.after;

  try {
    // Check if MFA was just enabled
    const mfaEnabledNow = after.multiFactor?.enrolledFactors.length && !before.multiFactor?.enrolledFactors.length;

    if (mfaEnabledNow) {
      // Log MFA enrollment success
      await admin.firestore().collection("analytics").add({
        event: "mfa_enabled",
        userId: after.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          method: after.multiFactor?.enrolledFactors[0].factorId,
          success: true
        },
      });

      // Send MFA confirmation email
      await admin.firestore().collection("mail").add({
        to: after.email,
        template: {
          name: "mfa_enabled",
          data: {
            name: after.displayName || "there",
          },
        },
      });
    }
  } catch (error) {
    console.error("Error tracking MFA enrollment:", error);
    // Log MFA enrollment failure
    await admin.firestore().collection("analytics").add({
      event: "mfa_enabled",
      userId: after.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: {
        success: false,
        error: error.message
      },
    });
  }
});

// Track registration completion and cleanup
export const onRegistrationComplete = functions.firestore
  .document("registrationProgress/{userId}")
  .onWrite(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    if (!after) return;

    try {
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

        // Send completion confirmation email
        const user = await admin.auth().getUser(context.params.userId);
        if (user.email) {
          await admin.firestore().collection("mail").add({
            to: user.email,
            template: {
              name: "registration_complete",
              data: {
                name: user.displayName || "there",
                mfaEnabled: after.enableMfa
              },
            },
          });
        }

        // Schedule cleanup after 24 hours
        setTimeout(async () => {
          try {
            await admin.firestore().collection("registrationProgress").doc(context.params.userId).delete();
          } catch (error) {
            console.error("Error cleaning up registration progress:", error);
          }
        }, 86400000); // 24 hours
      }
    } catch (error) {
      console.error("Error processing registration completion:", error);
    }
  });