import { getIndex } from "../db/pinecone";

/**
 * Generates vector embeddings for raw text fields using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small", // 1536 dimensions
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to generate embedding");
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw error;
  }
}

/**
 * Contextual Intent String Builder
 * Merges profile data into a single semantic string for indexing
 */
export function buildIntentString(role: string, building: string, lookingFor: string): string {
  return `Role: ${role}. Currently building: ${building}. Actively looking for: ${lookingFor}.`;
}