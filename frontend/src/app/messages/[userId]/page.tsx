"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getMessageHistory,
  connectChatSocket,
  getUserIdFromToken,
} from "@/lib/api";

type ChatMessage = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at?: string;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const otherUserId = parseInt(params.userId as string);
  const otherUsername = searchParams.get("username") || "User";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [myId, setMyId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setMyId(getUserIdFromToken(token));

    getMessageHistory(otherUserId, token).then(setMessages).catch(() => {});

    const socket = connectChatSocket(token);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.sender_id === otherUserId || data.receiver_id === otherUserId) {
        setMessages((prev) => [...prev, data]);
      }
    };

    return () => socket.close();
  }, [otherUserId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.send(
      JSON.stringify({ receiver_id: otherUserId, content: input })
    );
    setInput("");
  }

  let lastDate = "";

  return (
    <main className="page-enter flex h-screen flex-col bg-bg text-ink">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link
          href="/messages"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-gold transition-colors"
        >
          ←
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-surface font-display text-sm text-gold">
          {initials(otherUsername)}
        </div>
        <div>
          <h1 className="font-display text-lg text-ink leading-tight">{otherUsername}</h1>
          <p className="text-xs text-muted">{connected ? "Active now" : "Connecting..."}</p>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-muted">Say hello to {otherUsername}.</p>
            <p className="mt-1 text-xs text-muted">Your conversation starts here.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === myId;
          const dateLabel = m.created_at
            ? new Date(m.created_at).toDateString()
            : "";
          const showDate = dateLabel && dateLabel !== lastDate;
          lastDate = dateLabel;
          const prevSameSender = i > 0 && messages[i - 1].sender_id === m.sender_id;

          return (
            <div key={m.id}>
              {showDate && (
                <p className="my-4 text-center text-[11px] text-muted">
                  {dateLabel === new Date().toDateString() ? "Today" : dateLabel}
                </p>
              )}
              <div
                className={`flex ${mine ? "justify-end" : "justify-start"} ${
                  prevSameSender ? "mt-1" : "mt-4"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    mine
                      ? "rounded-br-sm bg-gold text-bg"
                      : "rounded-bl-sm border border-border bg-surface text-ink"
                  }`}
                >
                  {m.content}
                  <span
                    className={`ml-2 text-[10px] ${
                      mine ? "text-bg/60" : "text-muted"
                    }`}
                  >
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 border-t border-border bg-bg px-6 py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-sm text-ink outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </main>
  );
}
