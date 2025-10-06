import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();

// 🧹 Scheduled function — runs every 5 minutes
export const cleanupOldEntries = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Chicago", // optional
  },
  async (event): Promise<void> => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Delete waitingWords older than 3 minutes
    const waitingSnap = await db
      .collection("waitingWords")
      .where("createdAt", "<", threeMinutesAgo)
      .get();

    for (const doc of waitingSnap.docs) {
      await doc.ref.delete();
    }

    // Delete inactive chatRooms older than 10 minutes
    const roomsSnap = await db
      .collection("chatRooms")
      .where("active", "==", false)
      .where("createdAt", "<", tenMinutesAgo)
      .get();

    for (const doc of roomsSnap.docs) {
      await doc.ref.delete();
    }

    console.log("Cleanup completed at", new Date().toISOString());
  }
);
