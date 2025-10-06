import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { auth } from "./firebase";

const db = getFirestore();

export async function matchWord(word: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");


  const threeMinutesAgo = Timestamp.fromMillis(Date.now() - 3 * 60 * 1000);

  // Step 0: Clean up old waiting entries
  const waitingRef = collection(db, "waitingWords");
  const oldQ = query(waitingRef, where("createdAt", "<", threeMinutesAgo));
  const oldDocs = await getDocs(oldQ);
  for (const docSnap of oldDocs.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Use a transaction to avoid race conditions
  const result = await runTransaction(db, async () => {
    // Step 1: Check if someone else is already waiting for this word
    const freshQ = query(
      waitingRef,
      where("word", "==", word),
      where("createdAt", ">", threeMinutesAgo),
      orderBy("createdAt", "asc"),
      limit(1)
    );

    const snapshot = await getDocs(freshQ);

    if (!snapshot.empty) {
      // Match found — create a chat room
      const otherDoc = snapshot.docs[0];
      const otherData = otherDoc.data();

      if (otherData.userId === uid) {
        // You're already waiting — avoid self-match
        return { matched: false };
      }

      const chatRoomRef = await addDoc(collection(db, "chatRooms"), {
        word,
        users: [uid, otherData.userId],
        createdAt: serverTimestamp(),
        active: true,
        expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000), // 10-min expiry
      });

      // Remove the waiting record
      await deleteDoc(otherDoc.ref);

      return { matched: true, roomId: chatRoomRef.id };
    } else {
      // No match — add yourself to waitingWords
      await addDoc(waitingRef, {
        word,
        userId: uid,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 3 * 60 * 1000),
      });
      return { matched: false };
    }
  });

  return result;
}
