import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question = body.question;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      answer:
        'Atlas received your question. The AI connection will be added next.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to process the request.' },
      { status: 500 }
    );
  }
}