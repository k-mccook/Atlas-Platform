'use client';

import { useState } from 'react';

export default function SearchBar() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const askAtlas = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');

    try {
      const response = await fetch('/api/ask-atlas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      setAnswer('Atlas could not process your question.');
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

      {answer && (
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-900">
            Atlas
          </p>

          <p className="mt-2 text-sm leading-7 text-slate-700">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}