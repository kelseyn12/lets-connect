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
  doc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { auth } from "./firebase";

const db = getFirestore();

export async function matchWord(word: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");

  const now = Date.now();
  const threeMinutesAgo = now - 3 * 60 * 1000;

  // Use a transaction to avoid race conditions
  const result = await runTransaction(db, async (tx) => {
    // Step 1: Check if someone else is already waiting for this word
    const waitingRef = collection(db, "waitingWords");
    const q = query(
      waitingRef,
      where("word", "==", word),
      orderBy("createdAt", "asc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      // Match found — create a chat room
      const otherDoc = snapshot.docs[0];
      const otherData = otherDoc.data();

      if (otherData.userId === uid) {
        // You're already waiting — avoid self-match
        return { matched: false };
      }

      // Create a chat room
      const chatRoomRef = await addDoc(collection(db, "chatRooms"), {
        word,
        users: [uid, otherData.userId],
        createdAt: serverTimestamp(),
        active: true,
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
      });
      return { matched: false };
    }
  });

  return result;
}
