/**
 * Embedding Provider Strategy
 *
 * Auto-detects the available AI provider from env vars and returns
 * a unified interface for generating text embeddings.
 *
 * Priority: OpenAI → Google Gemini → (null = keyword fallback)
 *
 * To add a new provider in the future:
 *  1. Create a class implementing EmbeddingProvider
 *  2. Add detection logic in getEmbeddingProvider()
 */

export interface EmbeddingProvider {
  /** Human-readable name shown in API response */
  name: string;
  /**
   * Generate embeddings for an array of texts.
   * Returns a parallel array of float vectors.
   */
  embed(texts: string[]): Promise<number[][]>;
}

// ── OpenAI ──────────────────────────────────────────────────────────────────

class OpenAIProvider implements EmbeddingProvider {
  name = 'openai';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: this.apiKey });
    const res = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  }
}

// ── Google Gemini ────────────────────────────────────────────────────────────

class GeminiProvider implements EmbeddingProvider {
  name = 'gemini';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Using batch processing as recommended by Gemini docs for scalability
    const result = await model.batchEmbedContents({
      requests: texts.map((t) => ({
        model: 'models/gemini-embedding-001',
        content: { role: 'user', parts: [{ text: t }] },
      })),
    });

    return result.embeddings.map((e) => e.values);
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns the best available embedding provider based on env vars.
 * Returns null if no provider is configured → caller should use keyword fallback.
 */
export function getEmbeddingProvider(): EmbeddingProvider | null {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;

  if (openaiKey) return new OpenAIProvider(openaiKey);
  if (geminiKey) return new GeminiProvider(geminiKey);

  return null;
}
