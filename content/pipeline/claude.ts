import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-opus-5-5';

// Resolves ANTHROPIC_API_KEY or an `ant auth login` profile.
export const client = new Anthropic();

/**
 * One structured-output call. Server-side refusal fallbacks are on so a safety-classifier
 * false positive on, say, a biology passage reroutes instead of failing the batch.
 */
export async function jsonCall<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
}): Promise<T> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: opts.system,
    output_config: { effort: opts.effort, format: { type: 'json_schema', schema: opts.schema } },
    messages: [{ role: 'user', content: opts.user }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error(`Refused (${msg.stop_details?.category ?? 'unknown'})`);
  if (msg.stop_reason === 'max_tokens') throw new Error('Hit max_tokens');
  const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return JSON.parse(text) as T;
}
