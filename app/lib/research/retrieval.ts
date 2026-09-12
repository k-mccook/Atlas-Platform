import type { SearchResult, Topic } from './types';
import { preferredSections } from './analysis';

type RpcClient = { rpc: (name: string, params: { search_query: string }) => PromiseLike<{ data: unknown; error: unknown }> };

export async function retrieve(question: string, topics: Topic[], client: RpcClient) {
  const initial = await client.rpc('search_knowledge', { search_query: question });
  if (initial.error) throw new Error('Knowledge search unavailable');
  let rows = (initial.data ?? []) as SearchResult[];
  // Expand only when the RPC's twelve-row limit may hide evidence or for multi-part questions.
  // Up to three additional section searches; no unbounded query fan-out.
  if (rows.length >= 12 || topics.length > 1) {
    const queries = [...new Set(topics.map(topic => preferredSections[topic]).filter(Boolean))].slice(0, 3);
    const extra = await Promise.all(queries.map(search_query => client.rpc('search_knowledge', { search_query: search_query! })));
    if (extra.some(result => result.error)) throw new Error('Knowledge search unavailable');
    rows = rows.concat(extra.flatMap(result => (result.data ?? []) as SearchResult[]));
  }
  return rows;
}
