import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity';
import * as admin from "firebase-admin";

admin.initializeApp();

// Send welcome email when a new user is created
export const onUserCreated = beforeUserCreated(async (event) => {
  if (!event.data) return;

  const email = event.data.email;
  const displayName = event.data.displayName;
  const uid = event.data.uid;

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
      userId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending welcome email:", error.message);
    }
  }
});

// Track registration progress and handle MFA enrollment
export const onMfaUpdate = beforeUserSignedIn(async (event) => {
  if (!event.data) return;

  const currentUser = event.data;

  try {
    const before = await admin.auth().getUser(currentUser.uid);

    // Check if MFA was just enabled
    const mfaEnabledNow = currentUser.multiFactor?.enrolledFactors?.length && 
                         !before.multiFactor?.enrolledFactors?.length;

    if (mfaEnabledNow) {
      // Log MFA enrollment success
      await admin.firestore().collection("analytics").add({
        event: "mfa_enabled",
        userId: currentUser.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          method: currentUser.multiFactor?.enrolledFactors?.[0]?.factorId || 'phone',
          success: true
        },
      });

      // Send MFA confirmation email
      if (currentUser.email) {
        await admin.firestore().collection("mail").add({
          to: currentUser.email,
          template: {
            name: "mfa_enabled",
            data: {
              name: currentUser.displayName || "there",
            },
          },
        });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error tracking MFA enrollment:", error.message);
      // Log MFA enrollment failure
      await admin.firestore().collection("analytics").add({
        event: "mfa_enabled",
        userId: currentUser.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          success: false,
          error: error.message
        },
      });
    }
  }
});

// Track registration completion and cleanup
export const onRegistrationUpdate = onDocumentWritten('registrationProgress/{userId}', async (event) => {
  const after = event.data?.after?.data();
  const before = event.data?.before?.data();
  const userId = event.params.userId;

  if (!after || !userId) return;

  try {
    // Only track completed registrations
    if (after.completed && (!before || !before.completed)) {
      await admin.firestore().collection("analytics").add({
        event: "registration_completed",
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          steps: after.lastStep,
          mfaEnabled: after.enableMfa,
          timeToComplete: after.timestamp - (before?.timestamp || after.timestamp),
        },
      });

      // Send completion confirmation email
      try {
        const user = await admin.auth().getUser(userId);
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
      } catch (userError) {
        console.error("Error fetching user for completion email:", userError);
      }

      // Schedule cleanup after 24 hours
      setTimeout(async () => {
        try {
          await admin.firestore().collection("registrationProgress").doc(userId).delete();
        } catch (error) {
          if (error instanceof Error) {
            console.error("Error cleaning up registration progress:", error.message);
          }
        }
      }, 86400000); // 24 hours
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error processing registration completion:", error.message);
    }
  }
});