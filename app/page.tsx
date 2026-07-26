const features = [
  {
    title: "AI Guideline Search",
    description:
      "Surface FNMA, FHA, Freddie Mac, and USPAP guidance instantly with context-aware search.",
  },
  {
    title: "USPAP Research",
    description:
      "Get concise, cited guidance for appraisal standards, ethics, and reporting requirements.",
  },
  {
    title: "Report Support",
    description:
      "Draft stronger narratives and supporting analysis with AI-generated recommendations.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)] text-slate-900">
      <section className="mx-auto flex max-w-7xl flex-col px-6 py-16 lg:px-8 lg:py-24">
        <nav className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white shadow-lg shadow-slate-900/20">
              A
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-slate-900">Atlas</p>
              <p className="text-sm text-slate-500">Appraisal Intelligence</p>
            </div>
          </div>
          <a
            href="#features"
            className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm md:inline-flex"
          >
            Platform
          </a>
        </nav>

        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              Trusted by modern appraisal teams
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              The AI Operating System for Real Estate Appraisers
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Research FNMA, FHA, Freddie Mac and USPAP guidance in seconds.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-blue-900"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                See how it works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Fast compliance review</span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Cited research summaries</span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Built for appraisal workflows</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-sm font-medium text-blue-200">Live workspace</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <p className="text-sm font-semibold">Ask Atlas</p>
                  <p className="mt-1 text-sm text-slate-300">
                    “Summarize FHA guidance for this property type.”
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <p className="text-sm font-semibold">Guidance overview</p>
                  <p className="mt-1 text-sm text-slate-300">
                    FNMA and Freddie Mac standards surfaced in seconds.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <p className="text-sm font-semibold">Report draft</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Supporting language ready for review and submission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="features" className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/80"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg font-semibold text-blue-700">
                ✦
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
