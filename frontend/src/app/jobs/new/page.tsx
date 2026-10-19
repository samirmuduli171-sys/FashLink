"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createJob, getMyProfile } from "@/lib/api";

export default function NewJobPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    role_needed: "any",
    job_type: "full-time",
    location: "",
    skills: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    getMyProfile(token)
      .then((u) => {
        if (u.role !== "recruiter") router.push("/jobs");
        else setAllowed(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      await createJob(form, token);
      router.push("/jobs/manage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!allowed) return null;

  const field =
    "mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold";
  const label = "text-xs tracking-wide text-muted uppercase";

  return (
    <main className="page-enter flex min-h-screen items-center justify-center bg-bg px-6 py-16 text-ink">
      <div className="w-full max-w-lg">
        <Link href="/jobs" className="text-xs text-muted hover:text-gold">
          ← Back to jobs
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ink">Post a job</h1>
        <p className="mt-2 text-sm text-muted">
          Tell models and designers what you are looking for.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className={label}>Job title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={field}
              placeholder="Runway model for Autumn collection"
            />
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={field}
              placeholder="What the work involves, dates, pay, anything people should know"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Looking for</label>
              <select
                value={form.role_needed}
                onChange={(e) => setForm({ ...form, role_needed: e.target.value })}
                className={field}
              >
                <option value="any">Models and designers</option>
                <option value="model">Models only</option>
                <option value="designer">Designers only</option>
              </select>
            </div>
            <div>
              <label className={label}>Type</label>
              <select
                value={form.job_type}
                onChange={(e) => setForm({ ...form, job_type: e.target.value })}
                className={field}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="freelance">Freelance</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={field}
              placeholder="Bengaluru"
            />
          </div>

          <div>
            <label className={label}>Skills (comma separated)</label>
            <input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className={field}
              placeholder="runway, streetwear, pattern making"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full btn-primary bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post job"}
          </button>
        </form>
      </div>
    </main>
  );
}
