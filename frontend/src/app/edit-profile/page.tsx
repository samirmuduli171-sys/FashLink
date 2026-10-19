"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyProfile, updateProfile, uploadProfilePicture } from "@/lib/api";

export default function EditProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hiringRoles, setHiringRoles] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [picUploading, setPicUploading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
    getMyProfile(t).then((u) => {
      setRole(u.role);
      setBio(u.bio || "");
      setSkills(u.skills || "");
      setExperience(u.experience_years?.toString() || "");
      setLocation(u.location || "");
      setCompanyName(u.company_name || "");
      setHiringRoles(u.hiring_roles || "");
      setProfilePicture(u.profile_picture || null);
      setPhoneNumber(u.phone_number || "");
      setAddress(u.address || "");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setSaved(false);
    try {
      if (role === "recruiter") {
        await updateProfile(
          {
            bio,
            location,
            company_name: companyName,
            hiring_roles: hiringRoles,
            phone_number: phoneNumber,
            address,
          },
          token
        );
      } else {
        await updateProfile(
          {
            bio,
            skills,
            location,
            experience_years: experience ? parseInt(experience) : undefined,
            phone_number: phoneNumber,
          },
          token
        );
      }
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  async function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setPicUploading(true);
    try {
      const result = await uploadProfilePicture(file, token);
      setProfilePicture(result.profile_picture);
    } finally {
      setPicUploading(false);
    }
  }

  if (!token) return null;

  return (
    <main className="page-enter min-h-screen bg-bg px-6 py-10 text-ink md:px-12">
      <header className="flex items-center justify-between">
        <Link href="/dashboard" className="font-display text-xl tracking-[0.15em] text-ink">
          FASHLINK
        </Link>
        <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto mt-16 max-w-xl">
        <p className="text-xs tracking-[0.3em] text-gold uppercase">Profile</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Edit your profile</h1>
        <p className="mt-3 text-muted">
          This shows up on your public profile page.
        </p>

        <div className="mt-10 flex items-center gap-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
            {profilePicture ? (
              <img
                src={`http://localhost:8000/${profilePicture}`}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                No photo
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm text-ink hover:border-gold transition-colors">
              {picUploading ? "Uploading..." : "Change photo"}
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                disabled={picUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs tracking-wide text-muted uppercase">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="A few lines about you..."
            />
          </div>

          {role === "recruiter" ? (
            <>
              <div>
                <label className="text-xs tracking-wide text-muted uppercase">
                  Company name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                  placeholder="Studio Noir"
                />
              </div>

              <div>
                <label className="text-xs tracking-wide text-muted uppercase">
                  Roles you typically hire for (comma separated)
                </label>
                <input
                  type="text"
                  value={hiringRoles}
                  onChange={(e) => setHiringRoles(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                  placeholder="Runway models, pattern designers"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs tracking-wide text-muted uppercase">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                  placeholder="sustainable fashion, streetwear"
                />
              </div>

              <div>
                <label className="text-xs tracking-wide text-muted uppercase">
                  Experience (years)
                </label>
                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                  placeholder="2"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">Phone number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="+91 98765 43210"
            />
          </div>

          {role === "recruiter" && (
            <div>
              <label className="text-xs tracking-wide text-muted uppercase">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
                placeholder="Office address"
              />
            </div>
          )}

          <div>
            <label className="text-xs tracking-wide text-muted uppercase">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              placeholder="Bengaluru"
            />
          </div>

          {saved && <p className="text-sm text-gold">Saved.</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full btn-primary bg-gold px-6 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
