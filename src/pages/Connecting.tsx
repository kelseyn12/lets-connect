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
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2500); // every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  // word + snapshot listener
  const params = new URLSearchParams(location.search);
  const word = params.get("word");

  useEffect(() => {
    if (!word || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const chatRoomsRef = collection(db, "chatRooms");
    const q = query(chatRoomsRef, where("users", "array-contains", uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const room = snapshot.docs[0];
        navigate(`/chat?roomId=${room.id}&word=${word}`);
      }
    });

    return () => unsubscribe();
  }, [word, navigate]);

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
