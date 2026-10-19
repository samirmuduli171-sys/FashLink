import Link from "next/link";

const ticker = ["WALK", "SKETCH", "DESIGN", "STITCH"];

export default function Home() {
  return (
    <main className="page-enter min-h-screen bg-bg text-ink">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <span className="font-display text-xl tracking-[0.15em] text-ink">
          FASHLINK
        </span>
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <Link href="/discover" className="hover:text-ink transition-colors">
            Discover
          </Link>
          <Link href="/register" className="hover:text-ink transition-colors">
            For Talent
          </Link>
          <Link href="/register" className="hover:text-ink transition-colors">
            For Recruiters
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm text-muted hover:text-ink transition-colors sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full btn-primary bg-gold px-5 py-2 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
          >
            Join FashLink
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 md:px-12 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-xs tracking-[0.3em] text-gold uppercase">
            Portfolio · Analysis · Discovery
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-ink md:text-7xl">
            Your portfolio,
            <br />
            <em className="italic text-gold">read like couture.</em>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base text-muted md:text-lg">
            Upload your walks, sketches, and designs. FashLink reads the
            craft, scores it, and puts your work in front of the people
            casting next season.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full btn-primary bg-gold px-8 py-3 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
            >
              Create your profile
            </Link>
            <Link
              href="/discover"
              className="rounded-full btn-outline border border-border px-8 py-3 text-sm font-medium text-ink hover:border-gold transition-colors"
            >
              Browse talent
            </Link>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-y border-border py-4">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
          {Array(4)
            .fill(ticker)
            .flat()
            .map((word, i) => (
              <span
                key={i}
                className="font-display text-sm tracking-[0.25em] text-gold uppercase"
              >
                {word} <span className="text-border">—</span>
              </span>
            ))}
        </div>
      </div>

      {/* How it works */}
      <section className="px-6 py-24 md:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl text-ink md:text-4xl">
            From upload to discovery
          </h2>
          <div className="mt-14 grid gap-12 md:grid-cols-3">
            <div className="border-t border-border pt-6">
              <span className="font-display text-sm text-gold">01</span>
              <h3 className="mt-3 font-display text-xl text-ink">
                Upload your work
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Walks, sketches, designs, stitching — build a portfolio that
                actually shows your range.
              </p>
            </div>
            <div className="border-t border-border pt-6">
              <span className="font-display text-sm text-gold">02</span>
              <h3 className="mt-3 font-display text-xl text-ink">
                FashLink reads the craft
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Every piece gets analyzed and scored, with a report you can
                keep private or show on your profile.
              </p>
            </div>
            <div className="border-t border-border pt-6">
              <span className="font-display text-sm text-gold">03</span>
              <h3 className="mt-3 font-display text-xl text-ink">
                Get discovered
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Recruiters search by role, skill, and experience — your
                profile shows up where it fits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-muted sm:flex-row">
          <span>© 2026 FashLink</span>
          <span className="tracking-[0.15em]">
            WALK · SKETCH · DESIGN · STITCH
          </span>
        </div>
      </footer>
    </main>
  );
}
