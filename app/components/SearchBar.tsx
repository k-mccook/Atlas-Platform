'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

type AtlasSource = {
  chunk_id?: string;
  source_id?: string;
  source_title?: string;
  organization?: string;
  source_type?: string;
  source_url?: string;
  domain?: string;
  content?: string;
  rank?: number;
  section?: string;
  chunk_title?: string;
};

type AtlasResult = {
  answer: string;
  category?: string;
  confidence: 'High' | 'Medium' | 'Low';
  sources: AtlasSource[];
  topic?: string;
  target_source?: string | null;
  primary_section?: string | null;
  primary_section_title?: string | null;
  result_count?: number;
};

const suggestedQuestions = [
  "What are Fannie Mae's requirements for comparable sales?",
  'Does Fannie Mae have limits on gross or net adjustments?',
  'What does Fannie Mae require for verification of comparable sales?',
];

function formatTopic(topic?: string, category?: string) {
  switch (topic) {
    case 'comparable_sales':
      return 'Comparable Sales';

    case 'adjustments':
      return 'Comparable Adjustments';

    case 'sales_comparison':
      return 'Sales Comparison Approach';

    case 'reconciliation':
      return 'Reconciliation';

    case 'verification':
      return 'Comparable Verification';

    case 'concessions':
      return 'Sales Concessions';

    case 'market_area':
      return 'Comparable Market Area';

    case 'older_comparables':
      return 'Older Comparable Sales';

    case 'rural_comparables':
      return 'Rural Comparable Sales';

    case 'distance':
      return 'Comparable Distance';

    case 'listings_contracts':
      return 'Listings and Contract Sales';

    default:
      return category || 'Appraisal Guidance';
  }
}

function confidenceStyles(confidence: AtlasResult['confidence']) {
  switch (confidence) {
    case 'High':
      return {
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-500',
        label: 'High confidence',
      };

    case 'Medium':
      return {
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        dot: 'bg-amber-500',
        label: 'Medium confidence',
      };

    default:
      return {
        badge: 'border-red-200 bg-red-50 text-red-700',
        dot: 'bg-red-500',
        label: 'Low confidence',
      };
  }
}

function formatAnswer(answer: string) {
  return answer
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default function SearchBar() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AtlasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signInRequired, setSignInRequired] = useState(false);

  const askAtlas = async (questionToAsk?: string) => {
    const finalQuestion = (questionToAsk ?? question).trim();

    if (!finalQuestion) return;

    setQuestion(finalQuestion);
    setLoading(true);
    setError('');
    setSignInRequired(false);
    setResult(null);

    try {
      // The browser supplies the token; the API independently verifies it.
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setSignInRequired(true);
        setError('Please sign in to use Ask Atlas.');
        return;
      }
      const response = await fetch('/api/ask-atlas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          question: finalQuestion,
        }),
      });

      const resultData = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setSignInRequired(true);
          setError('Please sign in to use Ask Atlas.');
        } else {
          setError(response.status === 503
            ? 'Sign-in verification is temporarily unavailable. Please try again.'
            : 'Atlas could not process your question. Please try again.');
        }
        return;
      }

      setResult(resultData);
    } catch {
      setError('Atlas could not process your question. Please try again or sign in again.');
    } finally {
      setLoading(false);
    }
  };

  const uniqueSources = (result?.sources ?? []).filter(
    (source, index, sources) => {
      const sourceKey =
        source.source_id ||
        source.source_title ||
        source.source_url ||
        `source-${index}`;

      return (
        sources.findIndex(
          (item, itemIndex) =>
            (item.source_id ||
              item.source_title ||
              item.source_url ||
              `source-${itemIndex}`) === sourceKey
        ) === index
      );
    }
  );

  const primarySource = uniqueSources[0];

  const confidence = result
    ? confidenceStyles(result.confidence)
    : null;

  const displayTopic = result
    ? formatTopic(result.topic, result.category)
    : 'Appraisal Guidance';

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-900/30">
                A
              </div>

              <div>
                <p className="text-sm font-medium text-blue-300">
                  Atlas Appraisal Intelligence
                </p>

                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Ask Atlas
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Research appraisal guidance across FNMA, FHA, Freddie Mac and
              USPAP using natural-language questions.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Knowledge search online
          </div>
        </div>

        <div className="mt-7">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur sm:flex-row">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void askAtlas();
                }
              }}
              className="min-h-14 flex-1 rounded-xl border border-transparent bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
              placeholder="Ask a question about appraisal guidelines..."
              aria-label="Ask Atlas a question"
            />

            <button
              type="button"
              onClick={() => void askAtlas()}
              disabled={loading || !question.trim()}
              className="min-h-14 rounded-xl bg-blue-600 px-7 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Researching
                </span>
              ) : (
                'Ask Atlas'
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-slate-400">
              Try:
            </span>

            {suggestedQuestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  void askAtlas(suggestion);
                }}
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 sm:mx-8">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>

            <div>
              <p className="font-semibold text-red-800">
                Atlas could not complete the research
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>
              {signInRequired && (
                <a href="/login" className="mt-2 inline-block font-semibold text-blue-700 underline">
                  Sign in to Atlas
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="px-6 py-10 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                Atlas is researching your question
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Searching the available appraisal guidance and identifying the
                most relevant authority.
              </p>
            </div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="bg-slate-50/70">
          <div className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Research result
                </p>

                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  {displayTopic}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {result.target_source && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    {result.target_source}
                  </span>
                )}

                {confidence && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${confidence.badge}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${confidence.dot}`}
                    />
                    {confidence.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M12 3v18M3 12h18" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Atlas answer
                    </p>

                    <p className="text-sm font-medium text-slate-900">
                      Grounded in retrieved appraisal guidance
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {formatAnswer(result.answer).map(
                    (paragraph, index) => (
                      <p
                        key={`${paragraph.slice(0, 40)}-${index}`}
                        className="text-[15px] leading-7 text-slate-700"
                      >
                        {paragraph}
                      </p>
                    )
                  )}
                </div>
              </div>

              {primarySource && (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Primary authority
                      </p>

                      <h4 className="mt-2 text-lg font-semibold text-slate-950">
                        {result.primary_section_title ||
                          primarySource.chunk_title ||
                          primarySource.source_title ||
                          'Appraisal Guidance'}
                      </h4>

                      {result.primary_section && (
                        <p className="mt-1 text-sm font-medium text-blue-700">
                          Section {result.primary_section}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-slate-600">
                        {primarySource.organization ||
                          'Verified knowledge source'}
                        {primarySource.source_type
                          ? ` · ${primarySource.source_type}`
                          : ''}
                      </p>
                    </div>

                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm sm:flex">
                      ✓
                    </div>
                  </div>

                  {primarySource.source_url && (
                    <a
                      href={primarySource.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      View official source
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Research details
                </p>

                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-xs text-slate-500">
                      Authority
                    </dt>

                    <dd className="mt-1 font-semibold text-slate-900">
                      {result.target_source || 'Appraisal guidance'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">
                      Research topic
                    </dt>

                    <dd className="mt-1 font-semibold text-slate-900">
                      {displayTopic}
                    </dd>
                  </div>

                  {result.primary_section && (
                    <div>
                      <dt className="text-xs text-slate-500">
                        Relevant section
                      </dt>

                      <dd className="mt-1 font-semibold text-slate-900">
                        {result.primary_section}
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-xs text-slate-500">
                      Sources reviewed
                    </dt>

                    <dd className="mt-1 font-semibold text-slate-900">
                      {uniqueSources.length}
                    </dd>
                  </div>
                </dl>
              </div>

              {uniqueSources.length > 1 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Supporting sources
                  </p>

                  <div className="mt-4 space-y-3">
                    {uniqueSources.slice(1).map((source, index) => {
                      const title =
                        source.chunk_title ||
                        source.source_title ||
                        'Supporting guidance';

                      return (
                        <div
                          key={
                            source.source_id ||
                            source.source_url ||
                            `${title}-${index}`
                          }
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <p className="text-sm font-semibold leading-5 text-slate-800">
                            {title}
                          </p>

                          {source.section && (
                            <p className="mt-1 text-xs font-medium text-blue-600">
                              Section {source.section}
                            </p>
                          )}

                          {source.organization && (
                            <p className="mt-1 text-xs text-slate-500">
                              {source.organization}
                            </p>
                          )}

                          {source.source_url && (
                            <a
                              href={source.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                              View source →
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Research reminder
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Atlas provides research assistance based on the guidance
                  available in its knowledge base. Always review the cited
                  authority and apply professional judgment to the specific
                  assignment.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="px-6 py-10 sm:px-8">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 4 4" />
              </svg>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Start your appraisal research
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Ask Atlas a specific question about comparable sales,
              adjustments, verification, reconciliation, USPAP, or other
              appraisal guidance.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
