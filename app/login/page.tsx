export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-300/40 sm:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white shadow-lg shadow-slate-900/20">
            A
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900">Atlas</p>
            <p className="text-sm text-slate-500">Appraisal Intelligence</p>
          </div>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Sign in to continue to Atlas
          </p>
        </div>

        <form className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <a href="#" className="font-medium text-blue-600 transition hover:text-blue-700">
            Forgot Password?
          </a>
          <a href="/signup" className="font-medium text-slate-600 transition hover:text-slate-900">
            Create an Account
          </a>
        </div>
      </div>
    </main>
  )
}
