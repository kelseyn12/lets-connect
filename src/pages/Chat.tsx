import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendMessage, listenToMessages } from "../lib/chat";
import { auth, db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const roomId = params.get("roomId");

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const uid = auth.currentUser?.uid;

  // 🔹 Listen for incoming messages
  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenToMessages(roomId, setMessages);
    return () => unsubscribe();
  }, [roomId]);

  // 🔹 Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Handle sending message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !text.trim()) return;
    await sendMessage(roomId, text);
    setText("");
  }

  // 🔹 Leave handler
  const handleLeave = async () => {
    if (!roomId) {
      navigate("/");
      return;
    }

    try {
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, { active: false });
      console.log("👋 Room marked inactive");
    } catch (err) {
      console.error("Error marking room inactive:", err);
    }

    navigate("/");
  };

  // 🔹 Mark room inactive if user closes tab
  useEffect(() => {
    const handleUnload = async () => {
      if (!roomId) return;
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, { active: false });
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [roomId]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-blue-50 to-green-100">
      {/* Header with Leave Button */}
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h1 className="text-lg font-semibold text-gray-800">Chat Room</h1>
        <button
          onClick={handleLeave}
          className="bg-red-500 text-white px-3 py-1.5 rounded-md font-semibold hover:bg-red-600 transition-colors"
        >
          Leave
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs px-3 py-2 rounded-lg ${
              msg.senderId === uid
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-200 text-gray-800"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-4 bg-white border-t">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say hi..."
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
