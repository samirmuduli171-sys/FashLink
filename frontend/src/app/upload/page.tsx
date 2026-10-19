"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadPortfolioItem, runAnalysis } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [category, setCategory] = useState("walk");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
    } else {
      setToken(t);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !token) return;
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const item = await uploadPortfolioItem({ category, title, description, file, token });
      await runAnalysis(item.id, token);
      setSuccess(true);
      setTitle("");
      setDescription("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) return null;

  return (
    <main className="page-enter min-h-screen bg-bg px-6 py-10 text-ink md:px-12">
      <header className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-display text-xl tracking-[0.15em] text-ink"
        >
          FASHLINK
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto mt-16 max-w-xl">
        <p className="text-xs tracking-[0.3em] text-gold uppercase">
          Portfolio
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink">
          Upload your work
        </h1>
        <p className="mt-3 text-muted">
          Add a walk, sketch, design, or stitching sample to your portfolio.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
            >
              <option value="walk">Walk</option>
              <option value="sketch">Sketch</option>
              <option value="design">Design</option>
              <option value="stitching">Stitching</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="Runway walk — SS26 showcase"
            />
          </div>

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="A few lines about this piece..."
            />
          </div>

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              File
            </label>
            <input
              type="file"
              accept="image/*,video/mp4,video/quicktime"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-2 w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-bg"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && (
            <p className="text-sm text-gold">Uploaded successfully.</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full btn-primary bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </main>
  );
}
