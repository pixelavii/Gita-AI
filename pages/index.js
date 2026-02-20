"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const sendMessage = async () => {
    if (!msg.trim()) return;

    const userMsg = { role: "user", text: msg };
    setChat((c) => [...c, userMsg]);
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: msg }),
      });

      const data = await res.json();

      const aiMsg = { role: "ai", text: data.answer };
      setChat((c) => [...c, aiMsg]);
    } catch (err) {
      setChat((c) => [
        ...c,
        { role: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl h-[93vh] md:m-auto md:rounded-3xl md:mt-5 shadow-2xl border border-amber-200/40 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-200/40 dark:border-zinc-800">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Sparkles className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Bhagavad Gita AI Guide</h1>
          <p className="text-xs text-zinc-500">Calm wisdom from Krishna</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence>
          {chat.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${c.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  c.role === "user"
                    ? "bg-amber-100 dark:bg-zinc-800 text-gray-400"
                    : "bg-amber-50 text-amber-500 dark:bg-zinc-800 border border-amber-200/40 dark:border-zinc-800"
                }`}
              >
                {c.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking Animation */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-amber-600 text-sm"
          >
            <motion.div
              className="w-2 h-2 bg-amber-500 rounded-full"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
            <motion.div
              className="w-2 h-2 bg-amber-500 rounded-full"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }}
            />
            <motion.div
              className="w-2 h-2 bg-amber-500 rounded-full"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
            />
            <span className="ml-2">Krishna is guiding you…</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-amber-200/40 dark:border-zinc-800">
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-amber-200/40 dark:border-zinc-800 rounded-2xl px-3 py-2 shadow-sm">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Share what’s in your heart…"
            className="flex-1 bg-transparent outline-none text-sm"
          />

          <button
            onClick={sendMessage}
            className="p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.main>
  );
}
