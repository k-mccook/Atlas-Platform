import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body.question;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required.' },
        { status: 400 }
      );
    }

    // DEVELOPMENT MODE
    // This allows us to build and test Atlas without consuming API credits.
    const answer = `
Development Mode is working.

Atlas successfully received your question:

"${question}"

The AI knowledge engine is currently disabled while we build the
Atlas appraisal knowledge base.

Next, Atlas will be connected to authoritative appraisal sources
and will return answers with supporting citations.
`;

    return NextResponse.json({
      answer,
      mode: 'development',
    });
  } catch (error) {
    console.error('Ask Atlas error:', error);

    return NextResponse.json(
      { error: 'Atlas could not process your question.' },
      { status: 500 }
    );
  }
}