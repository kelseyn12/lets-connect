import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { sendMessage, listenToMessages } from "../lib/chat";
import { auth } from "../lib/firebase";

export default function Chat() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const roomId = params.get("roomId");

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenToMessages(roomId, setMessages);
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    await sendMessage(roomId, text);
    setText("");
  }

  const uid = auth.currentUser?.uid;

  return (
    <div className="flex flex-col min-h-screen bg-green-50">
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
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
