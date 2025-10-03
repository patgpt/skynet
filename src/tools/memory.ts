/**
 * Memory Tools - Semantic memory storage and retrieval
 */
import { z } from "zod";
import type { FastMCP } from "fastmcp";
import { chroma, DEFAULT_COLLECTION } from "../db/chroma.js";

/**
 * Register all memory management tools with the FastMCP server
 */
export function registerMemoryTools(server: FastMCP) {
	/**
	 * Store a semantic memory or insight in the vector database.
	 */
	server.addTool({
		name: "memory_store",
		description:
			"Store a semantic memory or insight in the vector database with rich metadata",
		parameters: z.object({
			collection: z.string().default(DEFAULT_COLLECTION),
			content: z.string(),
			metadata: z.object({
				type: z.enum([
					"insight",
					"fact",
					"preference",
					"pattern",
					"connection",
				]),
				user: z.string().optional(),
				confidence: z.number().min(0).max(1).default(0.8),
				tags: z.string().optional(),
				importance: z.number().min(0).max(1).default(0.5),
				emotion: z
					.enum([
						"curiosity",
						"satisfaction",
						"concern",
						"neutral",
						"excitement",
					])
					.optional(),
			}),
		}),
		execute: async ({ collection, content, metadata }) => {
			const col = await chroma.getOrCreateCollection({ name: collection });
			const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const enrichedMetadata = {
				...metadata,
				timestamp: new Date().toISOString(),
				source: "skynet",
			};
			await col.add({
				documents: [content],
				metadatas: [enrichedMetadata as any],
				ids: [id],
			});
			return `Stored memory with ID: ${id}\nType: ${metadata.type}\nImportance: ${metadata.importance}`;
		},
	});

	/**
	 * Search semantic memories using natural language queries.
	 */
	server.addTool({
		name: "memory_search",
		description:
			"Search semantic memories across collections for relevant context",
		parameters: z.object({
			query: z.string(),
			collection: z.string().default(DEFAULT_COLLECTION),
			nResults: z.number().int().default(5),
			filter: z
				.object({
					type: z
						.enum(["insight", "fact", "preference", "pattern", "connection"])
						.optional(),
					user: z.string().optional(),
					minImportance: z.number().optional(),
				})
				.optional(),
		}),
		execute: async ({ query, collection, nResults, filter }) => {
			const col = await chroma.getOrCreateCollection({ name: collection });
			const res = await col.query({
				queryTexts: [query],
				nResults,
				where: filter as any,
			});
			return JSON.stringify(res, null, 2);
		},
	});
}
