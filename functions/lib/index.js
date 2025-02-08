"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRegistrationUpdate = exports.onMfaUpdate = exports.onUserCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const identity_1 = require("firebase-functions/v2/identity");
const admin = require("firebase-admin");
admin.initializeApp();
// Send welcome email when a new user is created
exports.onUserCreated = (0, identity_1.beforeUserCreated)(async (event) => {
    if (!event.data)
        return;
    const email = event.data.email;
    const displayName = event.data.displayName;
    const uid = event.data.uid;
    if (!email)
        return;
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
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error sending welcome email:", error.message);
        }
    }
});
// Track registration progress and handle MFA enrollment
exports.onMfaUpdate = (0, identity_1.beforeUserSignedIn)(async (event) => {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!event.data)
        return;
    const currentUser = event.data;
    try {
        const before = await admin.auth().getUser(currentUser.uid);
        // Check if MFA was just enabled
        const mfaEnabledNow = ((_b = (_a = currentUser.multiFactor) === null || _a === void 0 ? void 0 : _a.enrolledFactors) === null || _b === void 0 ? void 0 : _b.length) &&
            !((_d = (_c = before.multiFactor) === null || _c === void 0 ? void 0 : _c.enrolledFactors) === null || _d === void 0 ? void 0 : _d.length);
        if (mfaEnabledNow) {
            // Log MFA enrollment success
            await admin.firestore().collection("analytics").add({
                event: "mfa_enabled",
                userId: currentUser.uid,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                data: {
                    method: ((_g = (_f = (_e = currentUser.multiFactor) === null || _e === void 0 ? void 0 : _e.enrolledFactors) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.factorId) || 'phone',
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
    }
    catch (error) {
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
exports.onRegistrationUpdate = (0, firestore_1.onDocumentWritten)('registrationProgress/{userId}', async (event) => {
    var _a, _b, _c, _d;
    const after = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
    const before = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.before) === null || _d === void 0 ? void 0 : _d.data();
    const userId = event.params.userId;
    if (!after || !userId)
        return;
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
                    timeToComplete: after.timestamp - ((before === null || before === void 0 ? void 0 : before.timestamp) || after.timestamp),
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
            }
            catch (userError) {
                console.error("Error fetching user for completion email:", userError);
            }
            // Schedule cleanup after 24 hours
            setTimeout(async () => {
                try {
                    await admin.firestore().collection("registrationProgress").doc(userId).delete();
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.error("Error cleaning up registration progress:", error.message);
                    }
                }
            }, 86400000); // 24 hours
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error processing registration completion:", error.message);
        }
    }
});
//# sourceMappingURL=index.js.map