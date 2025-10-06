import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";


export default function Connecting() {
  const navigate = useNavigate();
  const location = useLocation();
  const [_status, setStatus] = useState("Looking for a match...");

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
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="text-3xl font-semibold text-gray-800 flex gap-1">
        <span>Connecting</span>
        <span className="animate-pulse">.</span>
        <span className="animate-pulse delay-75">.</span>
        <span className="animate-pulse delay-150">.</span>
      </div>
    </div>
  );
}
