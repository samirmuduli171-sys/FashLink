"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMyJobs,
  getJobApplicants,
  updateApplicationStatus,
  toggleJobOpen,
} from "@/lib/api";

type MyJob = {
  id: number;
  title: string;
  role_needed: string;
  job_type: string;
  location: string | null;
  is_open: boolean;
  applicant_count: number;
};

type Applicant = {
  application_id: number;
  status: string;
  message: string | null;
  id: number;
  username: string;
  full_name: string | null;
  role: string;
  skills: string | null;
  location: string | null;
  profile_picture: string | null;
  ai_rating: number;
};

export default function ManageJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<Record<number, Applicant[]>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    getMyJobs(token)
      .then(setJobs)
      .catch(() => setError("Only recruiters can manage job postings."))
      .finally(() => setLoading(false));
  }, [router]);

  async function toggleApplicants(jobId: number) {
    if (openId === jobId) {
      setOpenId(null);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    setOpenId(jobId);
    try {
      const list = await getJobApplicants(jobId, token);
      setApplicants((prev) => ({ ...prev, [jobId]: list }));
    } catch {
      setApplicants((prev) => ({ ...prev, [jobId]: [] }));
    }
  }

  async function setStatus(jobId: number, applicationId: number, status: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await updateApplicationStatus(applicationId, status, token);
      setApplicants((prev) => ({
        ...prev,
        [jobId]: (prev[jobId] || []).map((a) =>
          a.application_id === applicationId ? { ...a, status } : a
        ),
      }));
    } catch {}
  }

  async function handleToggleOpen(jobId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const result = await toggleJobOpen(jobId, token);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, is_open: result.is_open } : j))
      );
    } catch {}
  }

  return (
    <main className="page-enter min-h-screen bg-bg px-6 py-10 text-ink md:px-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-[0.15em] text-ink">
          FASHLINK
        </Link>
        <Link href="/jobs" className="text-sm text-muted hover:text-ink transition-colors">
          All jobs
        </Link>
      </header>

      <div className="mx-auto mt-16 max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-display text-4xl text-ink">My postings</h1>
          <Link
            href="/jobs/new"
            className="btn-primary rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
          >
            Post a job
          </Link>
        </div>

        <div className="mt-10 space-y-4">
          {loading && <p className="text-sm text-muted">Loading...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && jobs.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted">You have not posted any jobs yet.</p>
              <Link
                href="/jobs/new"
                className="mt-3 inline-block text-sm text-gold hover:underline"
              >
                Post your first job
              </Link>
            </div>
          )}

          {jobs.map((j) => (
            <div key={j.id} className="rounded-lg border border-border bg-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl text-ink">{j.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {j.role_needed === "any" ? "Models and designers" : j.role_needed}
                    {", "}
                    {j.job_type}
                    {j.location ? `, ${j.location}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                    j.is_open
                      ? "border-gold/40 text-gold"
                      : "border-border text-muted"
                  }`}
                >
                  {j.is_open ? "Open" : "Closed"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => toggleApplicants(j.id)}
                  className="rounded-full border border-gold px-4 py-2 text-xs text-gold hover:bg-gold hover:text-bg transition-colors"
                >
                  {openId === j.id ? "Hide" : "View"} applicants ({j.applicant_count})
                </button>
                <button
                  onClick={() => handleToggleOpen(j.id)}
                  className="text-xs text-muted hover:text-ink transition-colors"
                >
                  {j.is_open ? "Close this job" : "Reopen this job"}
                </button>
              </div>

              {openId === j.id && (
                <div className="mt-5 space-y-3 border-t border-border pt-5">
                  {(applicants[j.id] || []).length === 0 && (
                    <p className="text-sm text-muted">No applicants yet.</p>
                  )}
                  {(applicants[j.id] || []).map((a) => (
                    <div
                      key={a.application_id}
                      className="rounded-lg border border-border bg-bg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
                          {a.profile_picture ? (
                            <img
                              src={`http://localhost:8000/${a.profile_picture}`}
                              alt={a.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                              -
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Link
                            href={`/profile/${a.username}`}
                            className="font-display text-base text-ink hover:text-gold"
                          >
                            {a.full_name || a.username}
                          </Link>
                          <p className="text-xs text-muted">
                            {a.role}
                            {a.location ? `, ${a.location}` : ""}, AI rating {a.ai_rating}
                          </p>
                        </div>
                        <span className="text-xs text-gold">
                          {a.status === "applied" ? "New" : a.status}
                        </span>
                      </div>

                      {a.message && (
                        <p className="mt-3 text-sm text-muted">{a.message}</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          onClick={() => setStatus(j.id, a.application_id, "shortlisted")}
                          className="rounded-full border border-gold px-4 py-1.5 text-xs text-gold hover:bg-gold hover:text-bg transition-colors"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => setStatus(j.id, a.application_id, "rejected")}
                          className="rounded-full border border-border px-4 py-1.5 text-xs text-muted hover:text-ink transition-colors"
                        >
                          Reject
                        </button>
                        <Link
                          href={`/messages/${a.id}?username=${encodeURIComponent(a.username)}`}
                          className="rounded-full border border-border px-4 py-1.5 text-xs text-muted hover:border-gold hover:text-ink transition-colors"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
