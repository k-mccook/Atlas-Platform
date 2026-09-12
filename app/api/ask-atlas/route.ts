import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MAX_AUTH_HEADER_LENGTH, readQuestion, boundedSupabaseFetch } from '../../lib/research/gateway';
import { research } from '../../lib/research/engine';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization') ?? '';
    const bearer = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
      authorization.length <= MAX_AUTH_HEADER_LENGTH ? authorization : ''
    );
    if (!bearer) {
      return NextResponse.json(
        { error: 'Please sign in to use Ask Atlas.' },
        { status: 401 }
      );
    }
    const token = bearer[1];

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            'Atlas is missing its Supabase environment configuration.',
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
          fetch: boundedSupabaseFetch,
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Verify independently; never trust a decoded token or browser user object.
    // Keep credentials and authentication error details out of logs/responses.
    let verified;
    try {
      verified = await supabase.auth.getUser(token);
    } catch {
      return NextResponse.json(
        { error: 'Sign-in verification is temporarily unavailable.' },
        { status: 503 }
      );
    }
    if (verified.error) {
      const invalidCredentials = [400, 401, 403, 422].includes(verified.error.status ?? 0);
      return NextResponse.json(
        { error: invalidCredentials
          ? 'Please sign in to use Ask Atlas.'
          : 'Sign-in verification is temporarily unavailable.' },
        { status: invalidCredentials ? 401 : 503 }
      );
    }
    if (!verified.data.user?.id || verified.data.user.role !== 'authenticated' || verified.data.user.is_anonymous) {
      return NextResponse.json(
        { error: 'Please sign in to use Ask Atlas.' },
        { status: 401 }
      );
    }

    let question: string;
    try {
      question = await readQuestion(request);
    } catch {
      return NextResponse.json({ error: 'Please enter a valid question of at most 2,000 characters.' }, { status: 400 });
    }

    return NextResponse.json(await research(question, supabase));
  } catch {
    console.error(
      'Ask Atlas API failed.'
    );

    return NextResponse.json(
      {
        error:
          'Atlas encountered an unexpected error.',
      },
      { status: 500 }
    );
  }
}
