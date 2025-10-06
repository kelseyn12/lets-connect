import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { matchWord } from "../lib/matching";

export default function Home() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);

    try {
      const result = await matchWord(word.trim().toLowerCase());
      if (result.matched) {
        navigate(`/chat?roomId=${result.roomId}`);
      } else {
        navigate(`/connecting?word=${word.trim().toLowerCase()}`);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-800">
      <h1 className="text-5xl font-bold mb-8">Let's Connect</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Type a word..."
          className="px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {loading ? "Connecting..." : "Connect"}
        </button>
      </form>
    </div>
  );
}
