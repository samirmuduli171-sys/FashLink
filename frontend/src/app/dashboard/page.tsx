"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import { getMyPortfolio, getMyProfile, runProfileAnalysis } from "@/lib/api";

type PortfolioItem = {
  id: number;
  file_path: string;
  file_type: string;
  category: string;
  title: string | null;
  description: string | null;
};

type Profile = {
  username: string;
  role: string;
  profile_picture: string | null;
  ai_rating: number;
  peer_rating: number;
  full_name: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setChecked(true);
    getMyPortfolio(token)
      .then(setItems)
      .catch(() => setItems([]));
    getMyProfile(token)
      .then(setProfile)
      .catch(() => {});
  }, [router]);

  async function handleGenerateReport() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setReportLoading(true);
    setReportMsg("");
    try {
      const result = await runProfileAnalysis(token);
      setReportMsg(`Report generated — ${result.rating_out_of_10}/10`);
      const updated = await getMyProfile(token);
      setProfile(updated);
    } catch (err) {
      setReportMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setReportLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  if (!checked || !profile) return null;

  const isRecruiter = profile.role === "recruiter";
  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="page-enter min-h-screen bg-bg px-6 py-10 text-ink md:px-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-xl tracking-[0.15em] text-ink">
            FASHLINK
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/discover" className="text-sm text-muted hover:text-ink transition-colors">
            Discover
          </Link>
          <Link href="/jobs" className="text-sm text-muted hover:text-ink transition-colors">
            Jobs
          </Link>
          <NotificationBell />
          {isRecruiter && (
            <Link href="/shortlist" className="text-sm text-muted hover:text-ink transition-colors">
              Shortlist
            </Link>
          )}
          <Link href="/messages" className="text-sm text-muted hover:text-ink transition-colors">
            Messages
          </Link>
          <Link
            href="/edit-profile"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            Edit profile
          </Link>
          <Link
            href={`/profile/${profile.username}`}
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            View public profile
          </Link>
          <button
            onClick={handleLogout}
            className="btn-outline rounded-full border border-border px-5 py-2 text-sm text-muted hover:border-gold hover:text-ink transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Hero identity strip */}
      <div className="mt-14 flex flex-col items-start gap-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-bg p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold/40">
            {profile.profile_picture ? (
              <img
                src={`http://localhost:8000/${profile.profile_picture}`}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface text-xs text-muted">
                No photo
              </div>
            )}
          </div>
          <div>
            <p className="text-xs tracking-[0.3em] text-gold uppercase">{profile.role}</p>
            <h1 className="mt-1 font-display text-3xl text-ink">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-sm text-muted">@{profile.username}</p>
          </div>
        </div>

        {!isRecruiter && (
          <div className="flex gap-8">
            <div className="text-center">
              <p className="font-display text-3xl text-gold">{profile.ai_rating}</p>
              <p className="mt-1 text-[10px] tracking-wide text-muted uppercase">AI Rating</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl text-ink">{profile.peer_rating}</p>
              <p className="mt-1 text-[10px] tracking-wide text-muted uppercase">Peer Rating</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl text-ink">{items.length}</p>
              <p className="mt-1 text-[10px] tracking-wide text-muted uppercase">Uploads</p>
            </div>
          </div>
        )}
      </div>

      {isRecruiter ? (
        <div className="mt-10">
          <h2 className="font-display text-2xl text-ink">Find your next hire</h2>
          <p className="mt-2 max-w-md text-muted">
            Search fashion talent by role, skills, experience, and location —
            ranked by how well they match what you need.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/discover"
              className="btn-primary rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
            >
              Search talent
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl text-ink">Your portfolio</h2>
              {Object.keys(categoryCounts).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <span
                      key={cat}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                    >
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="btn-outline rounded-full border border-gold px-6 py-3 text-sm font-medium text-gold hover:bg-gold hover:text-bg transition-colors disabled:opacity-50"
              >
                {reportLoading ? "Analyzing..." : "Generate AI Report"}
              </button>
              <Link
                href="/upload"
                className="btn-primary rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
              >
                Upload work
              </Link>
            </div>
          </div>

          {reportMsg && <p className="mt-4 text-sm text-gold">{reportMsg}</p>}

          {items.length === 0 ? (
            <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted">
                Nothing uploaded yet. Add your first walk, sketch, or design.
              </p>
              <Link
                href="/upload"
                className="btn-primary mt-4 inline-block rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
              >
                Upload your first piece
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="card-hover overflow-hidden rounded-lg border border-border bg-surface"
                >
                  {item.file_type === "image" ? (
                    <img
                      src={`http://localhost:8000/${item.file_path}`}
                      alt={item.title || item.category}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <video
                      src={`http://localhost:8000/${item.file_path}`}
                      className="aspect-square w-full object-cover"
                      muted
                    />
                  )}
                  <div className="p-3">
                    <p className="text-xs tracking-wide text-gold uppercase">{item.category}</p>
                    <p className="mt-1 truncate text-sm text-ink">{item.title || "Untitled"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
