export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-2xl">

        <h1 className="text-5xl font-bold text-center text-blue-900">
          Atlas
        </h1>

        <p className="text-center text-gray-500 mt-3">
          AI Assistant for Real Estate Appraisers
        </p>

        <div className="mt-10">

          <input
            className="w-full border rounded-lg p-4 text-lg"
            placeholder="Ask Atlas anything..."
          />

        </div>

        <button
          className="mt-5 w-full bg-blue-900 text-white p-4 rounded-lg hover:bg-blue-800"
        >
          Ask Atlas
        </button>

      </div>
    </main>
  );
}
