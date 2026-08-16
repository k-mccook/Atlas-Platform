import { NextResponse } from 'next/server';

type AskAtlasRequest = {
  question?: string;
};

type AtlasResponse = {
  answer: string;
  category: string;
  confidence: 'High' | 'Medium' | 'Low';
  sources: string[];
};

function classifyQuestion(question: string) {
  const text = question.toLowerCase();

  if (
    text.includes('uspap') ||
    text.includes('ethics') ||
    text.includes('appraisal standards')
  ) {
    return 'USPAP';
  }

  if (
    text.includes('fnma') ||
    text.includes('fannie mae') ||
    text.includes('selling guide')
  ) {
    return 'FNMA';
  }

  if (
    text.includes('freddie') ||
    text.includes('freddie mac') ||
    text.includes('guide')
  ) {
    return 'Freddie Mac';
  }

  if (
    text.includes('fha') ||
    text.includes('hud')
  ) {
    return 'FHA/HUD';
  }

  if (
    text.includes('comparable') ||
    text.includes('comp') ||
    text.includes('adjustment')
  ) {
    return 'Comparable Sales';
  }

  return 'General Appraisal';
}

function buildResponse(question: string): AtlasResponse {
  const category = classifyQuestion(question);

  return {
    answer:
      `Atlas received your question: "${question}". ` +
      `The question has been classified as ${category}. ` +
      `The Atlas knowledge engine is being prepared to provide ` +
      `source-backed appraisal guidance. No definitive conclusion ` +
      `should be relied upon until the applicable source material ` +
      `has been retrieved and verified.`,
    category,
    confidence: 'Low',
    sources: [],
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AskAtlasRequest;

    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        {
          error: 'Question is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (question.length > 2000) {
      return NextResponse.json(
        {
          error: 'Question is too long. Please keep questions under 2,000 characters.',
        },
        {
          status: 400,
        }
      );
    }

    const response = buildResponse(question);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Ask Atlas error:', error);

    return NextResponse.json(
      {
        error: 'Unable to process the request.',
      },
      {
        status: 500,
      }
    );
  }
}