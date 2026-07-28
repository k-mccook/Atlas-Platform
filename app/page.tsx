import Link from "next/link";

const features = [
  { title: "AI Guideline Search", description: "Find underwriting and appraisal guidance instantly." },
  { title: "USPAP Research", description: "Surface current standards and references in seconds." },
  { title: "Report Support", description: "Draft polished narrative support with AI assistance." },
  { title: "Assignment Management", description: "Keep tasks, deadlines, and notes organized." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_45%),linear-gradient(135deg,_#f8fbff_0%,_#eef6ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="rounded-full border border-blue-100 bg-white/80 px-5 py-3 shadow-sm backdrop-blur">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
                A
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Atlas
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Create Account
              </Link>
            </div>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              AI-powered appraisal intelligence
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              The AI Operating System for Real Estate Appraisers
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl">
              Research FNMA, FHA, Freddie Mac and USPAP guidance in seconds.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Start Free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_30px_80px_-20px_rgba(37,99,235,0.35)]">
              <div className="rounded-[22px] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-200">Ask Atlas</p>
                    <p className="mt-1 text-xl font-semibold">Guidance Overview</p>
                  </div>
                  <div className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-200">
                    Live
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <p className="text-sm text-slate-400">Suggested response</p>
                  <p className="mt-3 text-lg font-medium text-white">
                    Review FHA requirements and build a concise support memo for this assignment.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Report Draft</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Generate a first-pass appraisal narrative with cited guidance.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm text-slate-400">Priority</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Track deadlines, assignment notes, and reviewer requests.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white/70 py-6 text-center text-sm text-slate-600 backdrop-blur">
        © 2026 Atlas Appraisal Intelligence
      </footer>
    </main>
  );
}
