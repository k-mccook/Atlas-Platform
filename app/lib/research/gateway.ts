const MAX_BODY_BYTES = 16 * 1024;
const MAX_QUESTION_LENGTH = 2000;
export const MAX_AUTH_HEADER_LENGTH = 8192;
const BODY_READ_TIMEOUT_MS = 5000;
const UPSTREAM_TIMEOUT_MS = 10000;

export async function readQuestion(request: Request): Promise<string> {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const encoding = request.headers.get('content-encoding');
  const length = request.headers.get('content-length');
  if (contentType !== 'application/json' || (encoding && encoding.toLowerCase() !== 'identity')) {
    throw new Error('Invalid request');
  }
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
    throw new Error('Invalid request');
  }
  if (!request.body) throw new Error('Invalid request');
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request read deadline')), BODY_READ_TIMEOUT_MS);
  });
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new Error('Invalid request');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body) || !('question' in body)) {
      throw new Error('Invalid request');
    }
    const question = body.question;
    if (typeof question !== 'string' || question.length > MAX_QUESTION_LENGTH || !question.trim()) {
      throw new Error('Invalid request');
    }
    // Keep meaningful internal whitespace and Unicode unchanged for retrieval.
    return question.trim();
  } finally {
    clearTimeout(timer);
    // Do not wait on an uncooperative peer to finish cancelling its stream.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

// Buffer only upstream responses as before, but bound their transport lifetime.
// Sanitize transport errors before the SDK can log them; never expose headers.
export const boundedSupabaseFetch: typeof fetch = async (input, init) => {
  try {
    const deadline = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline;
    return await fetch(input, { ...init, signal, redirect: 'error' });
  } catch {
    return new Response('{"message":"Upstream service unavailable"}', {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }
};

