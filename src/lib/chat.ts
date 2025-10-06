import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "./firebase";

// Send a new message
export async function sendMessage(roomId: string, text: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in");
  if (!text.trim()) return;

  const messagesRef = collection(db, "chatRooms", roomId, "messages");

  await addDoc(messagesRef, {
    senderId: user.uid,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
    
    console.log("Message sent to:", roomId, text);
}



// Subscribe to live message updates
export function listenToMessages(roomId: string, callback: (messages: any[]) => void) {
  const messagesRef = collection(db, "chatRooms", roomId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(msgs);
  });
}
