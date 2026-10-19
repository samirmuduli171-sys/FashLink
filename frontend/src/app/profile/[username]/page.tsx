"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedMedia from "@/components/ProtectedMedia";
import {
  getProfile,
  rateUser,
  getMyProfile,
  getShortlistUsernames,
  addToShortlist,
  removeFromShortlist,
} from "@/lib/api";

type ProfileData = {
  user: {
    username: string;
    full_name: string | null;
    role: string;
    bio: string | null;
    skills: string | null;
    experience_years: number | null;
    location: string | null;
    profile_picture: string | null;
    company_name: string | null;
    hiring_roles: string | null;
    email: string;
    phone_number: string | null;
    address: string | null;
    ai_rating: number;
    ai_report_text: string | null;
    ai_suggestion_text: string | null;
    peer_rating: number;
    is_report_visible: boolean;
  };
  portfolio: {
    id: number;
    file_path: string;
    file_type: string;
    category: string;
    title: string | null;
  }[];
  reports: {
    id: number;
    portfolio_id: number;
    score: number;
    report_text: string;
    overlay_path: string | null;
    overlay_video_path: string | null;
  }[];
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [zoomedOverlay, setZoomedOverlay] = useState<string | null>(null);
  const [ratingMsg, setRatingMsg] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [viewerName, setViewerName] = useState("FashLink");
  const [viewerRole, setViewerRole] = useState("");
  const [shortlisted, setShortlisted] = useState(false);
  const [shortlistMsg, setShortlistMsg] = useState("");

  useEffect(() => {
    getProfile(username)
      .then(setData)
      .catch(() => setError("Profile not found"));
  }, [username]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) {
      getMyProfile(token)
        .then((u) => {
          setIsOwnProfile(u.username === username);
          setViewerName("@" + u.username);
          setViewerRole(u.role);
          if (u.role === "recruiter") {
            getShortlistUsernames(token)
              .then((list: string[]) => setShortlisted(list.includes(username)))
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [username]);

  async function handleRate(stars: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRatingLoading(true);
    setRatingMsg("");
    try {
      const result = await rateUser(username, stars, token);
      setRatingMsg(`Rated ${stars} star${stars > 1 ? "s" : ""}.`);
      setData((prev) =>
        prev
          ? { ...prev, user: { ...prev.user, peer_rating: result.peer_rating } }
          : prev
      );
    } catch (err) {
      setRatingMsg(err instanceof Error ? err.message : "Couldn't submit rating");
    } finally {
      setRatingLoading(false);
    }
  }

  async function toggleShortlist() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setShortlistMsg("");
    try {
      if (shortlisted) {
        await removeFromShortlist(username, token);
        setShortlisted(false);
      } else {
        await addToShortlist(username, token);
        setShortlisted(true);
      }
    } catch (err) {
      setShortlistMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (error) {
    return (
      <main className="page-enter flex min-h-screen items-center justify-center bg-bg text-ink">
        <p className="text-muted">{error}</p>
      </main>
    );
  }

  if (!data) return null;

  const { user, portfolio, reports } = data;
  const isRecruiter = user.role === "recruiter";
  const skillsList = user.skills
    ? user.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const hiringList = user.hiring_roles
    ? user.hiring_roles.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <main className="page-enter min-h-screen bg-bg px-6 py-10 text-ink md:px-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-[0.15em] text-ink">
          FASHLINK
        </Link>
        <Link href="/discover" className="text-sm text-muted hover:text-ink transition-colors">
          Discover
        </Link>
      </header>

      {isRecruiter ? (
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="flex items-center gap-4">
            {user.profile_picture && (
              <img
                src={`http://localhost:8000/${user.profile_picture}`}
                alt={user.username}
                className="h-16 w-16 rounded-full border border-border object-cover"
              />
            )}
            <div>
              <p className="text-xs tracking-[0.3em] text-gold uppercase">Recruiter</p>
              <h1 className="mt-1 font-display text-5xl text-ink">
                {user.full_name || user.username}
              </h1>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted">@{user.username}</p>

          {user.company_name && (
            <p className="mt-6 font-display text-2xl text-gold">{user.company_name}</p>
          )}

          {user.bio && <p className="mt-4 max-w-xl text-muted">{user.bio}</p>}

          <div className="mt-6 flex flex-wrap gap-2">
            {user.location && (
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                {user.location}
              </span>
            )}
          </div>

          {hiringList.length > 0 && (
            <div className="mt-10 rounded-lg border border-border bg-surface p-6">
              <p className="text-xs tracking-[0.3em] text-gold uppercase">Currently hiring for</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {hiringList.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-gold/40 px-3 py-1.5 text-sm text-gold"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-border bg-surface p-6">
            <p className="text-xs tracking-[0.3em] text-gold uppercase">Contact</p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-muted">
                <span className="text-ink">Email:</span> {user.email}
              </p>
              {user.phone_number && (
                <p className="text-muted">
                  <span className="text-ink">Phone:</span> {user.phone_number}
                </p>
              )}
              {user.address && (
                <p className="text-muted">
                  <span className="text-ink">Address:</span> {user.address}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="flex items-center gap-4">
              {user.profile_picture && (
                <img
                  src={`http://localhost:8000/${user.profile_picture}`}
                  alt={user.username}
                  className="h-16 w-16 rounded-full border border-border object-cover"
                />
              )}
              <div>
                <p className="text-xs tracking-[0.3em] text-gold uppercase">{user.role}</p>
                <h1 className="mt-1 font-display text-5xl text-ink">
                  {user.full_name || user.username}
                </h1>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted">@{user.username}</p>

            {user.bio && <p className="mt-6 max-w-xl text-muted">{user.bio}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              {user.location && (
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                  {user.location}
                </span>
              )}
              {user.experience_years !== null && (
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                  {user.experience_years} yrs experience
                </span>
              )}
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-10 border-y border-border py-6">
              <div>
                <p className="font-display text-3xl text-gold">{user.ai_rating}</p>
                <p className="mt-1 text-xs tracking-wide text-muted uppercase">AI Rating</p>
              </div>
              <div>
                <p className="font-display text-3xl text-ink">{user.peer_rating}</p>
                <p className="mt-1 text-xs tracking-wide text-muted uppercase">Peer Rating</p>
              </div>
              {isLoggedIn && !isOwnProfile && (
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">Rate this profile</p>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => handleRate(n)}
                        disabled={ratingLoading}
                        className="text-2xl text-border hover:text-gold transition-colors disabled:opacity-50"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {ratingMsg && <p className="mt-1 text-xs text-gold">{ratingMsg}</p>}
                </div>
              )}
            </div>

            {viewerRole === "recruiter" && !isOwnProfile && (
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={toggleShortlist}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                    shortlisted
                      ? "border border-gold text-gold hover:bg-gold hover:text-bg"
                      : "btn-primary bg-gold text-bg hover:opacity-90"
                  }`}
                >
                  {shortlisted ? "Shortlisted (click to remove)" : "Add to shortlist"}
                </button>
                <Link
                  href="/shortlist"
                  className="text-sm text-muted hover:text-ink transition-colors"
                >
                  View shortlist
                </Link>
                {shortlistMsg && <p className="text-sm text-red-400">{shortlistMsg}</p>}
              </div>
            )}

            {user.ai_report_text && user.is_report_visible && (() => {
              const sentences = user.ai_report_text
                .split(". ")
                .map((s) => s.trim())
                .filter(Boolean);
              const summary = sentences[0];
              const breakdown = sentences.slice(1);
              return (
                <div className="mt-6 rounded-lg border border-gold/30 bg-surface p-6">
                  <div className="flex items-start justify-between">
                    <p className="text-xs tracking-[0.3em] text-gold uppercase">AI Report</p>
                    <p className="font-display text-3xl text-gold">
                      {(user.ai_rating / 10).toFixed(1)}
                      <span className="text-base text-muted">/10</span>
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-muted">{summary}.</p>
                  {breakdown.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-border pt-4">
                      {breakdown.map((line, i) => {
                        const clean = line.replace(/\.+$/, "");
                        const [name, ...rest] = clean.split(":");
                        return (
                          <li key={i} className="flex items-baseline justify-between text-sm">
                            <span className="text-ink">{name.trim()}</span>
                            <span className="text-muted">{rest.join(":").trim()}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })()}

            <div className="mt-6 rounded-lg border border-border bg-surface p-6">
              <p className="text-xs tracking-[0.3em] text-gold uppercase">Contact</p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted">
                  <span className="text-ink">Email:</span> {user.email}
                </p>
                {user.phone_number && (
                  <p className="text-muted">
                    <span className="text-ink">Phone:</span> {user.phone_number}
                  </p>
                )}
              </div>
            </div>

            {user.ai_suggestion_text && user.is_report_visible && isOwnProfile && (
              <div className="mt-6 rounded-lg border border-border bg-surface p-6">
                <p className="text-xs tracking-[0.3em] text-gold uppercase">
                  Suggestions to improve
                </p>
                <ul className="mt-4 space-y-3">
                  {user.ai_suggestion_text
                    .split(". ")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((tip, i) => (
                      <li key={i} className="flex gap-3 text-sm text-muted">
                        <span className="text-gold">→</span>
                        <span>{tip.replace(/\.+$/, "")}.</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="font-display text-2xl text-ink">Portfolio</h2>
            {portfolio.length === 0 ? (
              <p className="mt-4 text-muted">No uploads yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {portfolio.map((item) => {
                  const report = reports.find((r) => r.portfolio_id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item.id)}
                      className="card-hover overflow-hidden rounded-lg border border-border bg-surface text-left"
                    >
                      <ProtectedMedia
                        src={`http://localhost:8000/${item.file_path}`}
                        type={item.file_type === "image" ? "image" : "video"}
                        alt={item.title || item.category}
                        protect={!isOwnProfile}
                        className="aspect-square w-full object-cover"
                        muted
                      />
                      <div className="p-3">
                        <p className="text-xs tracking-wide text-gold uppercase">{item.category}</p>
                        <p className="mt-1 truncate text-sm text-ink">{item.title || "Untitled"}</p>
                        {report && (
                          <p className="mt-1 text-xs text-gold">
                            Score: {report.score}/100 — tap to view report
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {selectedItem !== null && (() => {
        const item = portfolio.find((p) => p.id === selectedItem);
        const report = reports.find((r) => r.portfolio_id === selectedItem);
        if (!item) return null;

        const overlayPaths = report?.overlay_path
          ? report.overlay_path.split(",").filter(Boolean)
          : [];

        const sentences = report
          ? report.report_text.split(". ").map((s) => s.trim()).filter(Boolean)
          : [];
        const summaryLine = sentences[0] || "";
        const metricLines = sentences.slice(1).filter((l) => l.includes(":"));

        return (
          <div
            className="overlay-fade fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="modal-enter max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gold/20 bg-surface shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-t-2xl bg-black">
                <ProtectedMedia
                  src={`http://localhost:8000/${item.file_path}`}
                  type={item.file_type === "image" ? "image" : "video"}
                  alt={item.title || item.category}
                  protect={!isOwnProfile}
                  className="max-h-[50vh] w-full object-contain"
                  controls
                />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-ink hover:bg-black/80 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.25em] text-gold uppercase">
                      {item.category}
                    </p>
                    <h3 className="mt-1 font-display text-2xl text-ink">
                      {item.title || "Untitled"}
                    </h3>
                  </div>
                  {report && (
                    <div className="shrink-0 text-right">
                      <p className="font-display text-4xl text-gold">{report.score}</p>
                      <p className="text-[10px] tracking-wide text-muted uppercase">/ 100</p>
                    </div>
                  )}
                </div>

                {report && user.is_report_visible && (
                  <>
                    {summaryLine && (
                      <p className="mt-4 text-sm text-muted">{summaryLine}.</p>
                    )}

                    {metricLines.length > 0 && (
                      <div className="mt-5 space-y-3 border-t border-border pt-5">
                        {metricLines.map((line, i) => {
                          const clean = line.replace(/\.+$/, "");
                          const [namePart, ...rest] = clean.split(":");
                          const restJoined = rest.join(":").trim();
                          const match = restJoined.match(/([\d.]+)\/100/);
                          const value = match ? parseFloat(match[1]) : null;
                          return (
                            <div key={i}>
                              <div className="flex items-baseline justify-between text-sm">
                                <span className="text-ink">{namePart.trim()}</span>
                                <span className="text-muted">{restJoined}</span>
                              </div>
                              {value !== null && (
                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                                  <div
                                    className="h-full rounded-full bg-gold"
                                    style={{ width: `${Math.min(value, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {report.overlay_video_path && (
                      <div className="mt-6 border-t border-border pt-5">
                        <p className="text-xs tracking-[0.25em] text-gold uppercase">
                          Pose detection — full walk
                        </p>
                        <video
                          src={`http://localhost:8000/${report.overlay_video_path}`}
                          className="mt-3 w-full rounded-lg border border-border"
                          controls
                        />
                      </div>
                    )}

                    {overlayPaths.length > 0 && (
                      <div className="mt-6 border-t border-border pt-5">
                        <p className="text-xs tracking-[0.25em] text-gold uppercase">
                          Pose detection — sampled frames
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {overlayPaths.map((path, i) => (
                            <button
                              key={i}
                              onClick={() => setZoomedOverlay(path)}
                              className="aspect-square w-full overflow-hidden rounded-lg border border-border hover:border-gold transition-colors"
                            >
                              <img
                                src={`http://localhost:8000/${path}`}
                                alt={`Pose overlay ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {zoomedOverlay && (
        <div
          className="overlay-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setZoomedOverlay(null)}
        >
          <img
            src={`http://localhost:8000/${zoomedOverlay}`}
            alt="Pose overlay zoomed"
            className="max-h-[90vh] max-w-full rounded-lg border border-gold/30 object-contain"
          />
          <button
            onClick={() => setZoomedOverlay(null)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-ink hover:bg-black/80 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
