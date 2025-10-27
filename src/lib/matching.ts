import {
  getFirestore,
  collection,
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
// This adds the user to waitingWords and lets the Cloud Function handle matching
export async function matchWord(word: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user signed in");

  const waitingRef = collection(db, "waitingWords");
  const userDocRef = doc(waitingRef, uid);

  // 🧹 Clean up this user's old doc
  await deleteDoc(userDocRef).catch(() => {});

  // ✅ Add this user to waitingWords - Cloud Function will handle matching
  await runTransaction(db, async (transaction) => {
    // Check if there's already a waiting entry for this user
    const existingDoc = await transaction.get(userDocRef);
    
    // If no existing entry, create one
    if (!existingDoc.exists()) {
      transaction.set(userDocRef, {
        word,
        userId: uid,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 3600 * 1000),
      });
      console.log(`🕓 Added ${uid} to waitingWords for '${word}'`);
    }
  });

  // Return immediately - the Cloud Function will create the chat room
  // The client should listen for new chatRooms to be created
  return { matched: false };
}
