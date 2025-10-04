/**
 * ChromaDB Vector Database Client
 */
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";
import { ChromaClient } from "chromadb";
import { config } from "../config.js";

const chromaUrl = config.chroma.url;
const chromaPort = Number(chromaUrl.port || config.docker.ports.chroma);

/**
 * @name chroma
 * @description Configured ChromaDB client used for storing and querying semantic memory embeddings.
 * @see https://docs.trychroma.com/reference/js
 */
export const chroma = new ChromaClient({
	host: chromaUrl.hostname,
	port: chromaPort,
});

/**
 * @name embeddingFunction
 * @description Default embedding generator leveraged for creating vector representations when inserting memories into ChromaDB collections.
 * @see https://docs.trychroma.com/usage-guide#embeddings
 */
export const embeddingFunction = new DefaultEmbeddingFunction();

/**
 * @name DEFAULT_COLLECTION
 * @description Shared default ChromaDB collection used for semantic memory storage. Override via the `CHROMA_DEFAULT_COLLECTION` environment variable when needed.
 * @see https://docs.trychroma.com/usage-guide#collections
 */
export const DEFAULT_COLLECTION = config.chroma.defaultCollection;
