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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[var(--color-secondary)]/40 to-[var(--color-bg)] animate-fadeIn">
      {/* Title */}
      <h1 className="text-5xl sm:text-6xl font-bold text-[var(--color-primary)] mb-10 text-center drop-shadow-sm">
        Let’s Connect
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center gap-4 bg-white shadow-md rounded-2xl px-6 py-5 border border-[var(--color-muted)]"
      >
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Type a word..."
          className="w-64 sm:w-80 text-center rounded-xl border border-[var(--color-muted)] px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className={`rounded-xl px-6 py-3 font-semibold text-white transition-all
            ${loading
              ? "bg-[var(--color-primary)]/70 cursor-not-allowed"
              : "bg-[var(--color-primary)] hover:bg-blue-600 active:scale-95"}`}
        >
          {loading ? "Connecting..." : "Connect"}
        </button>
      </form>

      {/* Subtext */}
      <p className="mt-10 text-sm text-slate-500 text-center max-w-md">
        Type the same word as someone else and you’ll be instantly connected in a chat room.
      </p>
      <footer className="text-xs text-gray-500 mt-6 text-center">
        Built by Kelsey Nocek • <a href="/privacy" className="underline">Privacy</a>
      </footer>

    </div>

  );
}

