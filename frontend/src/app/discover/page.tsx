"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchTalent } from "@/lib/api";

type Candidate = {
  id: number;
  username: string;
  full_name: string | null;
  role: string;
  skills: string | null;
  experience_years: number | null;
  location: string | null;
  company_name: string | null;
  profile_picture: string | null;
  ai_rating: number;
  peer_rating: number;
  match_score: number;
  thumbnail_path: string | null;
};

export default function DiscoverPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  async function runSearch(filters: {
    query?: string;
    role?: string;
    skills?: string[];
    location?: string;
  }) {
    setLoading(true);
    try {
      const data = await searchTalent(filters);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch({});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    runSearch({
      query: query || undefined,
      role: role || undefined,
      skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      location: location || undefined,
    });
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

      <div className="mx-auto mt-16 max-w-4xl">
        <p className="text-xs tracking-[0.3em] text-gold uppercase">Discover</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Find fashion talent</h1>
        <p className="mt-3 text-muted">
          Search by name, company, role, skills, or location.
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-10 space-y-4 rounded-lg border border-border bg-surface p-6"
        >
          <div>
            <label className="text-xs tracking-wide text-muted uppercase">
              Search by name, username, or company
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="fashtest1, Studio Noir..."
              className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <RoleFilterDropdown value={role} onChange={setRole} />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs tracking-wide text-muted uppercase">
                Skills (comma separated)
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="sustainable fashion, streetwear"
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs tracking-wide text-muted uppercase">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bengaluru"
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full btn-primary bg-gold px-6 py-2.5 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="mt-10">
          {!loading && results.length === 0 && (
            <p className="text-muted">No matches found. Try broadening your search.</p>
          )}

          <div className="space-y-4">
            {results.map((c) => (
              <div
                key={c.id}
                onClick={() => router.push(`/profile/${c.username}`)}
                className="card-hover flex items-center gap-4 rounded-lg border border-border bg-surface p-5 cursor-pointer"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-bg">
                  {c.profile_picture || c.thumbnail_path ? (
                    <img
                      src={`http://localhost:8000/${c.profile_picture || c.thumbnail_path}`}
                      alt={c.full_name || c.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                      —
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-display text-lg text-ink">
                    {c.full_name || c.username}
                  </p>
                  <p className="mt-1 text-xs tracking-wide text-gold uppercase">
                    {c.role}
                    {c.role === "recruiter" && c.company_name ? ` · ${c.company_name}` : ""}
                    {c.location ? ` · ${c.location}` : ""}
                    {c.experience_years !== null ? ` · ${c.experience_years} yrs` : ""}
                  </p>
                  {c.skills && <p className="mt-2 text-sm text-muted">{c.skills}</p>}
                </div>

                <div className="text-right">
                  <p className="font-display text-2xl text-gold">{c.match_score}%</p>
                  <p className="text-xs text-muted">match</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/messages/${c.id}?username=${encodeURIComponent(c.username)}`);
                    }}
                    className="mt-2 rounded-full border border-gold px-3 py-1 text-xs text-gold hover:bg-gold hover:text-bg transition-colors"
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}


function RoleFilterDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = [
    { value: "", label: "Any" },
    { value: "model", label: "Model" },
    { value: "designer", label: "Designer" },
    { value: "recruiter", label: "Recruiter" },
  ];
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="text-xs tracking-wide text-muted uppercase">Role</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-2 flex w-full items-center justify-between rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold hover:border-gold/50"
      >
        <span>{selected?.label}</span>
        <svg
          className={`h-4 w-4 text-gold transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2.5 text-left text-sm transition-colors ${
                o.value === value
                  ? "bg-gold/10 text-gold"
                  : "text-ink hover:bg-bg hover:text-gold"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
