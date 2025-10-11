import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
  doc,
} from "firebase/firestore";
import { auth } from "./firebase";

const db = getFirestore();

// 🧹 Cancel waiting entry for current user
export async function cancelWaitingWord() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const userDocRef = doc(db, "waitingWords", uid);

  try {
    await deleteDoc(userDocRef);
    console.log("Removed waitingWords entry for", uid);
  } catch (err) {
    console.warn("No waitingWords entry to remove or insufficient permissions:", err);
  }
}

// 🤝 Match or wait for a user with the same word (atomic + safe)
export async function matchWord(word: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");

  const waitingRef = collection(db, "waitingWords");
  const userDocRef = doc(waitingRef, uid);
  const threeMinutesAgo = Timestamp.fromMillis(Date.now() - 3 * 60 * 1000);

  // 🧹 Step 0: Clean up this user's old doc (direct access)
  await deleteDoc(userDocRef).catch(() => {});

  // ⚡ Step 1: Run a transaction for atomic matching
  const result = await runTransaction(db, async (transaction) => {
    const freshQ = query(
      waitingRef,
      where("word", "==", word),
      where("createdAt", ">", threeMinutesAgo),
      orderBy("createdAt", "asc"),
      limit(1)
    );

    // Find potential match
    const snapshot = await getDocs(freshQ);
    const otherDoc = snapshot.docs.find((d) => d.id !== uid);

    if (otherDoc) {
      const otherRef = doc(waitingRef, otherDoc.id);
      const otherSnap = await transaction.get(otherRef);

      // Double-check existence before match
      if (!otherSnap.exists) {
        throw new Error("Other waiting user no longer exists");
      }

      const otherData = otherSnap.data() as any;

      // 🏠 Create chat room for both users atomically
      const chatRoomRef = doc(collection(db, "chatRooms"));
      transaction.set(chatRoomRef, {
        word,
        users: [uid, otherData.userId],
        createdAt: serverTimestamp(),
        active: true,
        expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      });

      // Remove both waiting docs atomically
      transaction.delete(otherRef);
      transaction.delete(userDocRef);

      console.log(`✅ Match created: ${uid} ↔ ${otherData.userId}`);
      return { matched: true, roomId: chatRoomRef.id };
    }

    // ⏳ No match found → add this user to waitingWords
    transaction.set(userDocRef, {
      word,
      userId: uid,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 3600 * 1000),
    });

    console.log(`🕓 Added ${uid} to waitingWords for '${word}'`);
    return { matched: false };
  });

  return result;
}
