import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();


//  Real-time match finder (runs whenever someone joins `waitingWords`)
export const tryMatchOnJoin = functions.firestore.onDocumentCreated(
  "waitingWords/{userId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const newData = snap.data();
    const { word, userId } = newData;

    console.log(`🔹 New waiting entry: ${userId} (${word})`);

    // Wait briefly to allow Firestore sync
    await new Promise((r) => setTimeout(r, 1500));

    const matchesRef = db.collection("waitingWords");
    const query = await matchesRef.where("word", "==", word).get();

    // Exclude the current user
    const otherDocs = query.docs.filter((d) => d.id !== userId);
    if (otherDocs.length === 0) {
      console.log(`No match yet for ${userId} (${word})`);
      return;
    }

    // Select the first waiting user
    const otherDoc = otherDocs[0];
    const otherData = otherDoc.data();

    // Confirm both users’ docs still exist
    const selfDoc = await db.collection("waitingWords").doc(userId).get();
    const confirmOther = await db.collection("waitingWords").doc(otherDoc.id).get();

    if (!selfDoc.exists || !confirmOther.exists) {
      console.log(`One of the waiting docs no longer exists`);
      return;
    }

    console.log(`Match found: ${userId} ↔️ ${otherData.userId}`);

    // Prevent reusing existing rooms for same users
    const existingChats = await db
      .collection("chatRooms")
      .where("word", "==", word)
      .where("users", "array-contains-any", [userId, otherData.userId])
      .get();

    if (!existingChats.empty) {
      console.log(`Existing chat found — skipping duplicate room`);
      await Promise.all([
        db.collection("waitingWords").doc(userId).delete(),
        db.collection("waitingWords").doc(otherDoc.id).delete(),
      ]);
      return;
    }

    // Create a brand-new chat room
    const chatRoomRef = await db.collection("chatRooms").add({
      word,
      users: [userId, otherData.userId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 10 * 60 * 1000) // expires in 10 min
      ),
      active: true,
    });

    // Clean up waitingWords entries
    await Promise.all([
      db.collection("waitingWords").doc(userId).delete(),
      db.collection("waitingWords").doc(otherDoc.id).delete(),
    ]);

    console.log(`Chat room created: ${chatRoomRef.id}`);
  }
);


// 🧹 2️⃣ Scheduled cleanup — runs every 5 minutes
export const cleanupOldEntries = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Chicago",
  },
  async (): Promise<void> => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // Remove old waitingWords
    const waitingSnap = await db
      .collection("waitingWords")
      .where("createdAt", "<", threeMinutesAgo)
      .get();

    for (const doc of waitingSnap.docs) {
      await doc.ref.delete();
    }

    // Remove inactive or expired chatRooms
    const roomsSnap = await db
      .collection("chatRooms")
      .where("active", "==", false)
      .get();

    for (const doc of roomsSnap.docs) {
      const data = doc.data();
      const expired =
        data.expiresAt && data.expiresAt.toDate() < new Date(tenMinutesAgo);
      if (expired) {
        await doc.ref.delete();
      }
    }

    console.log("🧹 Cleanup completed at", new Date().toISOString());
  }
);
