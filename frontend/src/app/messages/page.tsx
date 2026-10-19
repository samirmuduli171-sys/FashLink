"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getConversations } from "@/lib/api";

type Conversation = {
  user_id: number;
  username: string;
  full_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    getConversations(token)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="page-enter min-h-screen bg-bg px-6 py-12 text-ink">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink">Messages</h1>
            <p className="mt-2 text-sm text-muted">Your conversations with matches.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">
            Dashboard
          </Link>
        </div>

        <div className="mt-8 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {loading && (
            <p className="px-4 py-6 text-sm text-muted">Loading conversations...</p>
          )}
          {!loading && conversations.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-muted">No conversations yet.</p>
              <Link
                href="/discover"
                className="mt-3 inline-block text-sm text-gold hover:underline"
              >
                Find people to message
              </Link>
            </div>
          )}
          {conversations.map((c) => (
            <Link
              key={c.user_id}
              href={`/messages/${c.user_id}?username=${encodeURIComponent(c.username)}`}
              className="flex items-center gap-4 px-4 py-4 hover:bg-bg transition-colors"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-bg font-display text-sm text-gold">
                {initials(c.full_name || c.username)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-ink">
                    {c.full_name || c.username}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {timeAgo(c.last_message_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{c.last_message}</p>
              </div>
              {c.unread_count > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-medium text-bg">
                  {c.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
