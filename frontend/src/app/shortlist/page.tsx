"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getShortlist, removeFromShortlist } from "@/lib/api";

type Talent = {
  id: number;
  username: string;
  full_name: string | null;
  role: string;
  skills: string | null;
  location: string | null;
  experience_years: number | null;
  profile_picture: string | null;
  ai_rating: number;
  peer_rating: number;
};

export default function ShortlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    getShortlist(token)
      .then(setItems)
      .catch(() => setError("Only recruiters can see a shortlist."))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleRemove(username: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await removeFromShortlist(username, token);
      setItems((prev) => prev.filter((t) => t.username !== username));
    } catch {}
  }

  return (
    <main className="page-enter min-h-screen bg-bg px-6 py-10 text-ink md:px-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-[0.15em] text-ink">
          FASHLINK
        </Link>
        <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">
          Dashboard
        </Link>
      </header>

      <div className="mx-auto mt-16 max-w-3xl">
        <h1 className="font-display text-4xl text-ink">Your shortlist</h1>
        <p className="mt-3 text-muted">Talent you saved to come back to.</p>

        <div className="mt-10 space-y-4">
          {loading && <p className="text-sm text-muted">Loading...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted">No one shortlisted yet.</p>
              <Link
                href="/discover"
                className="mt-3 inline-block text-sm text-gold hover:underline"
              >
                Find talent to shortlist
              </Link>
            </div>
          )}

          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-5"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-bg">
                {t.profile_picture ? (
                  <img
                    src={`http://localhost:8000/${t.profile_picture}`}
                    alt={t.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                    -
                  </div>
                )}
              </div>

              <Link href={`/profile/${t.username}`} className="flex-1">
                <p className="font-display text-lg text-ink">
                  {t.full_name || t.username}
                </p>
                <p className="mt-1 text-xs text-gold">
                  {t.role}
                  {t.location ? `, ${t.location}` : ""}
                  {t.experience_years !== null ? `, ${t.experience_years} yrs` : ""}
                </p>
                {t.skills && <p className="mt-2 text-sm text-muted">{t.skills}</p>}
              </Link>

              <div className="text-right">
                <p className="font-display text-2xl text-gold">{t.ai_rating}</p>
                <p className="text-xs text-muted">AI rating</p>
                <button
                  onClick={() => handleRemove(t.username)}
                  className="mt-2 rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-gold hover:text-gold transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
