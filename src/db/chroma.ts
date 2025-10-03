/**
 * ChromaDB Vector Database Client
 */
import { ChromaClient } from "chromadb";

const chromaUrl = new URL(process.env.CHROMA_URL ?? "http://localhost:8000");

/**
 * ChromaDB client instance for semantic memory operations.
 * Used for storing and querying embeddings of memories, insights, and knowledge.
 */
export const chroma = new ChromaClient({
  path: chromaUrl.toString(),
});

/**
 * Default collection name for memories
 */
export const DEFAULT_COLLECTION = "skynet_memories";
