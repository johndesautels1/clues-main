/**
 * Olivia Chat API Client
 * All calls to the /api/olivia-chat proxy go through here.
 */

interface OliviaChatResponse {
  reply: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    durationMs: number;
  };
}

export async function sendOliviaMessage(params: {
  messages: { role: 'user' | 'assistant'; content: string }[];
  system: string;
  sessionId?: string;
}): Promise<string> {
  const response = await fetch('/api/olivia-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: params.messages,
      system: params.system,
      sessionId: params.sessionId,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.detail ?? err.error);
  }

  const data: OliviaChatResponse = await response.json();
  return data.reply;
}
