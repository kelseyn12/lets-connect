import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export default function Connecting() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Looking for a match...");

  // Get word from URL
  const params = new URLSearchParams(location.search);
  const word = params.get("word");

  useEffect(() => {
    if (!word || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const chatRoomsRef = collection(db, "chatRooms");

    // Listen for a chat room that includes this user
    const q = query(chatRoomsRef, where("users", "array-contains", uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const room = snapshot.docs[0];
        setStatus("Match found!");
        navigate(`/chat?roomId=${room.id}`);
      }
    });

    return () => unsubscribe();
  }, [word]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-100">
      <h1 className="text-4xl font-bold text-yellow-800 mb-6">Connecting...</h1>
      <p className="text-lg text-yellow-700 animate-pulse">{status}</p>
    </div>
  );
}
