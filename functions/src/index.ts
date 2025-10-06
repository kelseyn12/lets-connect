import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// 🧹 Scheduled function — runs every 5 minutes
export const cleanupOldEntries = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // 🧹 Delete waitingWords older than 3 minutes
    const waitingSnap = await db
      .collection("waitingWords")
      .where("createdAt", "<", admin.firestore.Timestamp.fromDate(threeMinutesAgo))
      .get();

    for (const doc of waitingSnap.docs) {
      await doc.ref.delete();
    }
    console.log(`🧹 Deleted ${waitingSnap.size} old waitingWords`);

    // 🧹 Delete chatRooms older than 10 minutes
    const chatSnap = await db
      .collection("chatRooms")
      .where("createdAt", "<", admin.firestore.Timestamp.fromDate(tenMinutesAgo))
      .get();

    for (const doc of chatSnap.docs) {
      await doc.ref.delete();
    }
    console.log(`🧹 Deleted ${chatSnap.size} old chatRooms`);

    return null;
  });
