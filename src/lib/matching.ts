import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
  doc,
} from "firebase/firestore";
import { auth } from "./firebase";

const db = getFirestore();

export async function cancelWaitingWord() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const waitingRef = collection(db, "waitingWords");
  const q = query(waitingRef, where("userId", "==", uid));
  const snapshot = await getDocs(q);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  console.log("Removed waitingWords entry for", uid);
}

export async function matchWord(word: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");

  const waitingRef = collection(db, "waitingWords");
  const threeMinutesAgo = Timestamp.fromMillis(Date.now() - 3 * 60 * 1000);

  // Step 0: Remove any old waiting docs for this user
  const existingDocs = await getDocs(query(waitingRef, where("userId", "==", uid)));
  for (const docSnap of existingDocs.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Step 1: Delete waiting entries older than 3 min
  const oldQ = query(waitingRef, where("createdAt", "<", threeMinutesAgo));
  const oldDocs = await getDocs(oldQ);
  for (const docSnap of oldDocs.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Step 2: Run transaction to find a match
  const result = await runTransaction(db, async () => {
    const freshQ = query(
      waitingRef,
      where("word", "==", word),
      where("createdAt", ">", threeMinutesAgo),
      orderBy("createdAt", "asc"),
      limit(1)
    );

    const snapshot = await getDocs(freshQ);
    const otherDoc = snapshot.docs.find((d) => d.data().userId !== uid);

    if (otherDoc) {
      const otherData = otherDoc.data();

      // Create chat room
      const chatRoomRef = await addDoc(collection(db, "chatRooms"), {
        word,
        users: [uid, otherData.userId],
        createdAt: serverTimestamp(),
        active: true,
        expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      });

      // Clean up both waiting docs
      await deleteDoc(otherDoc.ref);
      await deleteDoc(doc(waitingRef, uid)); // ensure self-clean

      return { matched: true, roomId: chatRoomRef.id };
    }

    // No match yet → add yourself
    await setDoc(doc(waitingRef, uid), {
      word,
      userId: uid,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 3600 * 1000),
    });

    return { matched: false };
  });

  return result;
}

