import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { chroma, DEFAULT_COLLECTION, embeddingFunction } from "../db/chroma.js";
import { formatErrorMessage } from "../utils/errors.js";
import { formatTextOrJson } from "../utils/format.js";
import { generateId } from "../utils/id.js";
import { outputFormatSchema } from "../utils/schemas.js";

export function registerMemoryTools(server: FastMCP) {
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
			const requestId = generateId("memory_store");
			try {
				const col = await chroma.getOrCreateCollection({
					name: collection,
					embeddingFunction,
				});
				const id = generateId("mem");
				const enrichedMetadata = {
					...metadata,
					timestamp: new Date().toISOString(),
					source: "skynet",
				};
				await col.add({
					documents: [content],
					metadatas: [enrichedMetadata],
					ids: [id],
				});

				return [
					`Request ID: ${requestId}`,
					`Stored memory with ID: ${id}`,
					`Type: ${enrichedMetadata.type}`,
					`Importance: ${enrichedMetadata.importance}`,
				].join("\n");
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Memory store", error),
				].join("\n");
			}
		},
	});
	server.addTool({
		name: "memory_search",
		description:
			"Search semantic memories across collections for relevant context",
		parameters: z.object({
			query: z.string(),
			collection: z.string().default(DEFAULT_COLLECTION),
			nResults: z.number().int().min(1).max(50).default(5),
			filter: z
				.object({
					type: z
						.enum(["insight", "fact", "preference", "pattern", "connection"])
						.optional(),
					user: z.string().optional(),
					minImportance: z.number().optional(),
				})
				.optional(),
			format: outputFormatSchema,
		}),
		execute: async ({ query, collection, nResults, filter, format }) => {
			const requestId = generateId("memory_search");
			const col = await chroma.getOrCreateCollection({
				name: collection,
				embeddingFunction,
			});
			const res = await col.query({
				queryTexts: [query],
				nResults,
				where: filter,
			});

			const payload = {
				requestId,
				collection,
				results: res,
			};

			return formatTextOrJson(format, payload, () => {
				const documents = res.documents?.[0] ?? [];
				const ids = res.ids?.[0] ?? [];
				const distances = res.distances?.[0] ?? [];

				const lines = ids.map((id, idx) => {
					const distance = distances[idx] ?? "N/A";
					const doc = documents[idx] ?? "";
					return [
						`Result ${idx + 1}:`,
						`- ID: ${id}`,
						`- Distance: ${distance}`,
						`- Document: ${doc}`,
					].join("\n");
				});

				return [
					`Request ID: ${requestId}`,
					`Memory search in collection "${collection}" for query "${query}"`,
					"",
					lines.join("\n\n") || "No results found.",
				].join("\n");
			});
		},
	});
}
