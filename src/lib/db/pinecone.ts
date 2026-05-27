import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY in environment variables.");
}

// Initialize the Pinecone Client
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const getIndex = () => {
  const indexName = process.env.PINECONE_INDEX_NAME || "quad-intent-matches";
  return pinecone.index(indexName);
};