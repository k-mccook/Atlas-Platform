import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';

export default function AskAtlasPage() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Header />

        <div className="mx-auto max-w-7xl p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Research workspace
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Ask Atlas
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Ask natural-language questions about appraisal requirements,
              underwriting guidance, comparable sales, adjustments,
              verification, reconciliation, USPAP, FHA, Freddie Mac and
              Fannie Mae.
            </p>
          </div>

          <SearchBar />
        </div>
      </main>
    </div>
  );
}