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

// 🤝 Match or wait for a user with the same word
export async function matchWord(word: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");

  const waitingRef = collection(db, "waitingWords");
  const userDocRef = doc(waitingRef, uid);
  const threeMinutesAgo = Timestamp.fromMillis(Date.now() - 3 * 60 * 1000);

  // 🧹 Step 0: Clean up this user's old doc (direct access, no query)
  await deleteDoc(userDocRef).catch(() => {});

  // 🧹 Step 1: Delete entries older than 3 min (optional global cleanup)
  const oldQ = query(waitingRef, where("createdAt", "<", threeMinutesAgo));
  const oldDocs = await getDocs(oldQ);
  for (const old of oldDocs.docs) {
    await deleteDoc(old.ref);
  }

  // ⚡ Step 2: Try to find a match
  const result = await runTransaction(db, async (transaction) => {
    const freshQ = query(
      waitingRef,
      where("word", "==", word),
      where("createdAt", ">", threeMinutesAgo),
      orderBy("createdAt", "asc"),
      limit(1)
    );

    const snapshot = await getDocs(freshQ);
    const otherDoc = snapshot.docs.find((d) => d.id !== uid);

    if (otherDoc) {
      const otherData = otherDoc.data();

      // 🏠 Create chat room for both users
      const chatRoomRef = await addDoc(collection(db, "chatRooms"), {
        word,
        users: [uid, otherData.userId],
        createdAt: serverTimestamp(),
        active: true,
        expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      });

      // Clean up both waiting docs
      await deleteDoc(otherDoc.ref);
      await deleteDoc(userDocRef);

      return { matched: true, roomId: chatRoomRef.id };
    }

    // ⏳ No match → add current user to waiting list
    await setDoc(userDocRef, {
      word,
      userId: uid,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 3600 * 1000),
    });

    return { matched: false };
  });

  return result;
}
