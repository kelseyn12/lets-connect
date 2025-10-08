import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendMessage, listenToMessages } from "../lib/chat";
import { auth, db } from "../lib/firebase";
import {
  doc,
  updateDoc,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const roomId = params.get("roomId");

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [roomActive, setRoomActive] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null); // 👈 NEW
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const uid = auth.currentUser?.uid;

  // Identify the other user in this chat room
  useEffect(() => {
    if (!roomId || !uid) return;
    const roomRef = doc(db, "chatRooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const otherId = data?.users?.find((u: string) => u !== uid) || null;
        setOtherUserId(otherId);
      }
    });
    return () => unsubscribe();
  }, [roomId, uid]);

  // Listen for incoming messages
  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenToMessages(roomId, setMessages);
    return () => unsubscribe();
  }, [roomId]);

// ✅ Mark messages as seen only when user is actually viewing the chat
useEffect(() => {
  if (!roomId || !uid || messages.length === 0) return;

  const markSeen = async () => {
    // Only mark as seen if the tab is visible AND focused
    if (document.visibilityState !== "visible" || !document.hasFocus()) return;

    const unseen = messages.filter(
      (m) => m.senderId !== uid && (!m.seenBy || !m.seenBy.includes(uid))
    );
    if (unseen.length === 0) return;

    const updates = unseen.map(async (m) => {
      const msgRef = doc(db, "chatRooms", roomId, "messages", m.id);
      await updateDoc(msgRef, { seenBy: [...(m.seenBy || []), uid] });
    });
    await Promise.all(updates);
  };

  // Run immediately if visible
  markSeen();

  // Re-check when window/tab regains focus
  window.addEventListener("focus", markSeen);

  return () => {
    window.removeEventListener("focus", markSeen);
  };
}, [messages, roomId, uid]);


  // Listen for room becoming inactive or typing changes
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "chatRooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      // Someone left
      if (data?.active === false) {
        setRoomActive(false);
        setMessages((prev) => {
          const alreadyShown = prev.some((m) => m.id === "system-left");
          if (alreadyShown) return prev;
          return [
            ...prev,
            {
              id: "system-left",
              text: "The other user has left the chat 👋",
              senderId: "system",
            },
          ];
        });
      }

      // Typing status
      if (data?.typing && data.typing !== uid) {
        setIsOtherTyping(true);
      } else {
        setIsOtherTyping(false);
      }
    });

    return () => unsubscribe();
  }, [roomId, uid]);

  //  Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  // Handle sending messages
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !text.trim() || !roomActive) return;
    await sendMessage(roomId, text);
    setText("");

    // Reset typing status
    const roomRef = doc(db, "chatRooms", roomId);
    await updateDoc(roomRef, { typing: null });
  }

  // Leave handler
  const handleLeave = async () => {
    if (!roomId) {
      navigate("/");
      return;
    }

    try {
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, { active: false });

      // System message for the other user
      await addDoc(collection(roomRef, "messages"), {
        text: "The other user has left the chat 👋",
        senderId: "system",
        createdAt: serverTimestamp(),
      });

      console.log("👋 Room marked inactive");
    } catch (err) {
      console.error("Error marking room inactive:", err);
    }

    navigate("/");
  };

  //  Mark room inactive if user closes tab
  useEffect(() => {
    const handleUnload = async () => {
      if (!roomId) return;
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, { active: false });
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [roomId]);

  //  Handle typing updates
  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);

    if (!roomId || !uid) return;
    const roomRef = doc(db, "chatRooms", roomId);

    // Mark user as typing
    await updateDoc(roomRef, { typing: uid });

    // Reset typing state after 1.5s of inactivity
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(async () => {
      await updateDoc(roomRef, { typing: null });
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-blue-50 to-green-100">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h1 className="text-lg font-semibold text-gray-800">Chat Room</h1>
        {/* Floating Leave Button */}
        <button
          onClick={handleLeave}
          className="fixed bottom-20 right-5 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-600 opacity-80 hover:opacity-100 transition-all transform hover:scale-105 z-50"
        >
          Leave
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                msg.senderId === "system"
                  ? "mx-auto bg-gray-200 text-gray-600 italic text-center"
                  : msg.senderId === uid
                  ? "ml-auto bg-blue-500 text-white"
                  : "mr-auto bg-gray-200 text-gray-800"
              }`}
            >
              {msg.text}
            </div>

            {/* ✅ Seen indicator: only if other user has seen */}
            {msg.senderId === uid &&
              otherUserId &&
              msg.seenBy?.includes(otherUserId) && (
                <div className="text-xs text-gray-400 text-right mt-1 mr-2">
                  Seen ✅
                </div>
              )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isOtherTyping && (
          <div className="text-sm italic text-gray-500 animate-pulse ml-2">
            The other user is typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-4 bg-white border-t">
        <input
          type="text"
          value={text}
          onChange={handleTyping}
          placeholder={
            roomActive ? "Say hi..." : "The other user has left the chat 👋"
          }
          disabled={!roomActive}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!roomActive || !text.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
