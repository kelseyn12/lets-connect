import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { cancelWaitingWord } from "../lib/matching";

export default function Connecting() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messageIndex, setMessageIndex] = useState(0);

  const statusMessages = [
    "Looking for someone who typed the same word...",
    "Searching the universe for your match...",
    "Almost there, someone’s typing the same word...",
    "Patience, the cosmos is aligning...",
  ];

  // cycle through status messages
useEffect(() => {
  // ✅ 1. get word safely from the URL
  const params = new URLSearchParams(location.search);
  const word = params.get("word");

  if (!word || !auth.currentUser) return;

  const uid = auth.currentUser.uid;
  const chatRoomsRef = collection(db, "chatRooms");

  // 🟡 optional (not used yet, but keeping it if you plan time filtering)
  // const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const q = query(
    chatRoomsRef,
    where("users", "array-contains", uid),
    where("word", "==", word),
    where("active", "==", true)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      // Pick the most recent active room
      const rooms = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      const sorted = rooms.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      const room = sorted[0];
      if (room) {
        navigate(`/chat?roomId=${room.id}&word=${word}`);
      }
    }
  });

  return () => unsubscribe();
}, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <div className="transition-opacity duration-500 ease-in-out">
        {statusMessages[messageIndex]}
      </div>
      <button
        onClick={async () => {
          await cancelWaitingWord();
          navigate("/");
        }}
        className="mt-6 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
      >
        Cancel
      </button>
      <div className="flex gap-1 text-4xl text-gray-600">
        <span className="animate-pulse">.</span>
        <span className="animate-pulse delay-75">.</span>
        <span className="animate-pulse delay-150">.</span>
      </div>
    </div>
  );
}
