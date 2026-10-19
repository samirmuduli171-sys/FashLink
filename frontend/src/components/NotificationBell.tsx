"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
} from "@/lib/api";

type Notif = {
  id: number;
  type: string;
  text: string;
  link: string | null;
  is_read: boolean;
  created_at: string | null;
};

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    function refreshCount() {
      getUnreadCount(token as string)
        .then((d) => setCount(d.count))
        .catch(() => {});
    }
    refreshCount();
    const timer = setInterval(refreshCount, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function toggle() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const list = await getNotifications(token);
        setItems(list);
        await markAllNotificationsRead(token);
        setCount(0);
      } catch {}
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted hover:border-gold hover:text-gold transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-bg">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No notifications yet.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setOpen(false);
                  if (n.link) router.push(n.link);
                }}
                className="flex w-full items-start justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-bg transition-colors"
              >
                <span
                  className={`text-sm ${n.is_read ? "text-muted" : "text-ink"}`}
                >
                  {n.text}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {timeAgo(n.created_at)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
