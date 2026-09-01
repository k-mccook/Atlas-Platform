import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

type KnowledgeResult = {
  chunk_id: string;
  source_id: string;
  source_title: string;
  organization: string;
  source_type: string;
  source_url: string;
  domain: string;
  content: string;
  rank: number;
};

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

    const results = (data ?? []) as KnowledgeResult[];

    /*
     * Remove duplicate sources while preserving the best-ranked
     * chunk from each source.
     */
    const uniqueSources = results.reduce(
      (sources: KnowledgeResult[], current: KnowledgeResult) => {
        const alreadyExists = sources.some(
          (source) => source.source_id === current.source_id
        );

        if (!alreadyExists) {
          sources.push(current);
        }

        return sources;
      },
      []
    );

    /*
     * Determine confidence from the quality and consistency
     * of the retrieved evidence.
     */
    let confidence: 'High' | 'Medium' | 'Low' = 'Low';

    if (results.length >= 3) {
      confidence = 'High';
    } else if (results.length >= 1) {
      confidence = 'Medium';
    }

    /*
     * Determine the primary category from the strongest source.
     */
    const primarySource = results[0];

    const category =
      primarySource?.source_type ||
      primarySource?.domain ||
      'General';

    /*
     * Build the response from the strongest matching knowledge
     * chunks.
     *
     * For now this is intentionally retrieval-based. The next
     * phase will add the AI synthesis layer.
     */
    let answer =
      'Atlas could not find sufficiently relevant information in its current knowledge base.';

    if (results.length > 0) {
      answer = results[0].content;
    }

    return NextResponse.json({
      answer,
      category,
      confidence,
      sources: uniqueSources.map((source) => ({
        chunk_id: source.chunk_id,
        source_id: source.source_id,
        source_title: source.source_title,
        organization: source.organization,
        source_type: source.source_type,
        source_url: source.source_url,
        domain: source.domain,
        content: source.content,
        rank: source.rank,
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