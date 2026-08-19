'use client';

import { useState } from 'react';

type AtlasResult = {
  answer: string;
  category: string;
  confidence: 'High' | 'Medium' | 'Low';
  sources: string[];
};

export default function SearchBar() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AtlasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askAtlas = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/ask-atlas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setResult(data);
    } catch (error) {
      console.error('Ask Atlas error:', error);
      setError('Atlas could not process your question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="mb-3 block text-lg font-semibold text-slate-900">
        Ask Atlas
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void askAtlas();
            }
          }}
          className="flex-1 rounded-xl border border-slate-300 p-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Ask FNMA, FHA, Freddie Mac or USPAP..."
        />

        <button
          type="button"
          onClick={() => void askAtlas()}
          disabled={loading || !question.trim()}
          className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Thinking...' : 'Ask Atlas'}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Atlas
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {result.category}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Confidence: {result.confidence}
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-700">
            {result.answer}
          </p>

          {(result.sources ?? []).length > 0 ? (
            <div className="mt-5 border-t border-blue-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Sources
              </p>

              <ul className="mt-2 space-y-1">
                {(result.sources ?? []).map((source) => (
                  <li
                    key={source}
                    className="text-sm text-slate-600"
                  >
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-5 border-t border-blue-100 pt-4 text-xs text-slate-500">
              No verified sources have been attached yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}