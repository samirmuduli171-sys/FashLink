"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getJobs, getMyProfile, applyToJob } from "@/lib/api";

type Job = {
  id: number;
  title: string;
  description: string;
  role_needed: string;
  location: string | null;
  skills: string | null;
  job_type: string;
  created_at: string | null;
  recruiter_username: string;
  recruiter_name: string;
  company_name: string | null;
  applied: boolean;
  my_status: string | null;
};

function postedAgo(iso: string | null) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [viewerRole, setViewerRole] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  async function load(search: string) {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      setJobs(await getJobs(token, search));
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    getMyProfile(token)
      .then((u) => setViewerRole(u.role))
      .catch(() => {});
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitApply(jobId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setMsg("");
    try {
      await applyToJob(jobId, note, token);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, applied: true, my_status: "applied" } : j
        )
      );
      setApplyingId(null);
      setNote("");
      setMsg("Application sent.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not apply");
    }
  }

  const isRecruiter = viewerRole === "recruiter";

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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-gold uppercase">Jobs</p>
            <h1 className="mt-3 font-display text-4xl text-ink">Open positions</h1>
          </div>
          {isRecruiter && (
            <div className="flex gap-3">
              <Link
                href="/jobs/manage"
                className="rounded-full border border-border px-5 py-2.5 text-sm text-muted hover:border-gold hover:text-ink transition-colors"
              >
                My postings
              </Link>
              <Link
                href="/jobs/new"
                className="btn-primary rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
              >
                Post a job
              </Link>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
          className="mt-8 flex gap-3"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, skill or location"
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
          />
          <button
            type="submit"
            className="btn-primary rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </form>

        {msg && <p className="mt-4 text-sm text-gold">{msg}</p>}

        <div className="mt-8 space-y-4">
          {loading && <p className="text-sm text-muted">Loading...</p>}
          {!loading && jobs.length === 0 && (
            <p className="text-muted">No open jobs right now.</p>
          )}

          {jobs.map((j) => {
            const canApply =
              !isRecruiter &&
              (j.role_needed === "any" || j.role_needed === viewerRole);
            return (
              <div
                key={j.id}
                className="rounded-lg border border-border bg-surface p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl text-ink">{j.title}</h2>
                    <p className="mt-1 text-sm text-gold">
                      <Link
                        href={`/profile/${j.recruiter_username}`}
                        className="hover:underline"
                      >
                        {j.company_name || j.recruiter_name}
                      </Link>
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted">{postedAgo(j.created_at)}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">
                    {j.role_needed === "any" ? "Models and designers" : j.role_needed}
                  </span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                    {j.job_type}
                  </span>
                  {j.location && (
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                      {j.location}
                    </span>
                  )}
                </div>

                <p className="mt-4 whitespace-pre-line text-sm text-muted">
                  {j.description}
                </p>
                {j.skills && (
                  <p className="mt-3 text-xs text-muted">
                    <span className="text-ink">Skills:</span> {j.skills}
                  </p>
                )}

                {!isRecruiter && (
                  <div className="mt-5">
                    {j.applied ? (
                      <span className="rounded-full border border-border px-4 py-2 text-xs text-muted">
                        {j.my_status === "shortlisted"
                          ? "Shortlisted"
                          : j.my_status === "rejected"
                          ? "Not selected"
                          : "Applied"}
                      </span>
                    ) : !canApply ? (
                      <span className="text-xs text-muted">
                        This job is for {j.role_needed}s only.
                      </span>
                    ) : applyingId === j.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          placeholder="Add a short note (optional)"
                          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => submitApply(j.id)}
                            className="btn-primary rounded-full bg-gold px-5 py-2 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
                          >
                            Send application
                          </button>
                          <button
                            onClick={() => {
                              setApplyingId(null);
                              setNote("");
                            }}
                            className="text-sm text-muted hover:text-ink transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setApplyingId(j.id);
                          setNote("");
                          setMsg("");
                        }}
                        className="btn-primary rounded-full bg-gold px-5 py-2 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
