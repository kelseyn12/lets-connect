import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { cancelWaitingWord } from "../lib/matching";

export default function Connecting() {
  const navigate = useNavigate();
  const location = useLocation();

  const [messageIndex, setMessageIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Looking for someone who typed the same word..."
  );
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const statusMessages = [
    "Looking for someone who typed the same word...",
    "Searching the universe for your match...",
    "Almost there, someone’s typing the same word...",
    "Patience, the cosmos is aligning...",
  ];

  // 🌀 Cycle through messages every few seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 4000);

    return () => clearInterval(messageInterval);
  }, []);

  // 🕒 Timeout after 30 seconds if no match
  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasTimedOut(true);
      setStatusMessage("No match found — try again 💭");
      cancelWaitingWord(); // optional cleanup
    }, 30000); // 30 seconds

    return () => clearTimeout(timeout);
  }, []);

  // 💬 Watch for room match in Firestore
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const word = params.get("word");

    if (!word || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const chatRoomsRef = collection(db, "chatRooms");

    const q = query(
      chatRoomsRef,
      where("users", "array-contains", uid),
      where("word", "==", word),
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
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

  // ✨ Update displayed message when index changes
  useEffect(() => {
    setStatusMessage(statusMessages[messageIndex]);
  }, [messageIndex]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-purple-200 text-gray-800">
      <div className="text-2xl font-semibold text-center transition-opacity duration-500 ease-in-out">
        {statusMessage}
      </div>

      {hasTimedOut ? (
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      ) : (
        <button
          onClick={async () => {
            await cancelWaitingWord();
            navigate("/");
          }}
          className="mt-6 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      )}

      {!hasTimedOut && (
        <div className="flex gap-1 text-4xl text-gray-600 mt-2">
          <span className="animate-pulse">.</span>
          <span className="animate-pulse delay-75">.</span>
          <span className="animate-pulse delay-150">.</span>
        </div>
      )}
    </div>
  );
}
