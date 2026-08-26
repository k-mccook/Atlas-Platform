import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

type KnowledgeSource = {
  chunk_id: string;
  source_id: string;
  source_title: string;
  organization: string;
  source_type: string;
  source_url: string | null;
  content: string;
  rank: number;
};

function determineCategory(question: string, sourceType?: string) {
  const q = question.toLowerCase();

  if (sourceType) {
    if (sourceType.toLowerCase().includes('uad')) return 'UAD 3.6';
    if (sourceType.toLowerCase().includes('va')) return 'VA';
    if (sourceType.toLowerCase().includes('fha')) return 'FHA';
    if (sourceType.toLowerCase().includes('uspap')) return 'USPAP';
    if (sourceType.toLowerCase().includes('fannie')) return 'Fannie Mae';
    if (sourceType.toLowerCase().includes('freddie')) return 'Freddie Mac';
  }

  if (q.includes('uad') || q.includes('urar')) return 'UAD 3.6';
  if (q.includes('va')) return 'VA';
  if (q.includes('fha') || q.includes('hud')) return 'FHA';
  if (q.includes('uspap')) return 'USPAP';
  if (q.includes('fannie')) return 'Fannie Mae';
  if (q.includes('freddie')) return 'Freddie Mac';

  return 'Appraisal Guidance';
}

function buildAnswer(
  question: string,
  sources: KnowledgeSource[]
): {
  answer: string;
  confidence: 'High' | 'Medium' | 'Low';
} {
  if (sources.length === 0) {
    return {
      answer:
        "Atlas doesn't currently have enough verified information in its knowledge base to answer this question confidently.",
      confidence: 'Low',
    };
  }

  const best = sources[0];
  const content = best.content.trim();
  const q = question.toLowerCase();

  /*
   * For "when" questions, look for sentences containing dates,
   * mandatory/required language, or effective-date language.
   */
  if (
    q.includes('when') ||
    q.includes('date') ||
    q.includes('effective') ||
    q.includes('mandatory')
  ) {
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const datePattern =
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i;

    const relevant = sentences.find(
  (sentence) =>
    datePattern.test(sentence) &&
    /mandatory|mandate|required|must|effective/i.test(sentence)
);

    if (relevant) {
      return {
        answer: relevant,
        confidence: sources.length >= 2 ? 'High' : 'Medium',
      };
    }
  }

  /*
   * For "can I / can we" questions, prefer sentences containing
   * permission, restriction, exception, or prohibition language.
   */
  if (
    q.startsWith('can ') ||
    q.includes('allowed') ||
    q.includes('may ') ||
    q.includes('still ')
  ) {
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const relevant = sentences.find((sentence) =>
      /may|must|cannot|can't|only|except|exception|permitted|allowed|required/i.test(
        sentence
      )
    );

    if (relevant) {
      return {
        answer: relevant,
        confidence: sources.length >= 2 ? 'High' : 'Medium',
      };
    }
  }

  /*
   * Otherwise return the strongest retrieved passage.
   * This keeps Atlas grounded in verified knowledge instead
   * of inventing an answer.
   */
  return {
    answer: content,
    confidence:
      sources.length >= 3 && best.rank >= 3
        ? 'High'
        : best.rank >= 2
          ? 'Medium'
          : 'Low',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('search_knowledge', {
      search_query: question,
    });

    if (error) {
      console.error('Knowledge search error:', error);

      return NextResponse.json(
        {
          error: 'Atlas could not search the knowledge base.',
        },
        { status: 500 }
      );
    }

    const sources = (data ?? []) as KnowledgeSource[];

    const result = buildAnswer(question, sources);

    return NextResponse.json({
      answer: result.answer,
      category: determineCategory(
        question,
        sources[0]?.source_type
      ),
      confidence: result.confidence,
      sources: sources.map((source) => ({
        chunk_id: source.chunk_id,
        source_id: source.source_id,
        source_title: source.source_title,
        organization: source.organization,
        source_type: source.source_type,
        source_url: source.source_url,
        content: source.content,
      })),
    });
  } catch (error) {
    console.error('Ask Atlas error:', error);

    return NextResponse.json(
      {
        error: 'Unable to process your question.',
      },
      { status: 500 }
    );
  }
}