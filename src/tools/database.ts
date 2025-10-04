/**
 * Database Tools - Direct access to graph and vector databases
 *
 * Refactored to follow FastMCP best practices:
 * - Export tool definitions instead of register function
 * - Use proper return formats (no JSON.stringify)
 * - Add annotations
 * - Add parameter descriptions
 */
import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { chroma, embeddingFunction } from "../db/chroma.js";
import { driver } from "../db/memgraph.js";
import { formatErrorMessage } from "../utils/errors.js";
import { formatTextOrJson } from "../utils/format.js";
import { generateId } from "../utils/id.js";
import { outputFormatSchema } from "../utils/schemas.js";

export function registerDatabaseTools(server: FastMCP) {
	server.addTool({
		name: "graph_query" as const,
		description: "Execute a Cypher query against Memgraph and return rows",
		parameters: z.object({
			cypher: z.string().describe("The Cypher query to execute"),
			params: z
				.record(z.string(), z.unknown())
				.default({})
				.describe("Query parameters"),
			format: outputFormatSchema,
		}),
		annotations: {
			title: "Execute Graph Query",
			readOnlyHint: false,
			openWorldHint: true,
		},
		execute: async ({ cypher, params, format }) => {
			const session = driver.session();
			const requestId = generateId("graph_query");
			try {
				const res = await session.run(cypher, params);
				const records = res.records.map((record) => record.toObject());

				const payload = {
					requestId,
					records,
				};

				return formatTextOrJson(format, payload, () => {
					if (records.length === 0) {
						return [
							`Request ID: ${requestId}`,
							"Query executed successfully. No results returned.",
						].join("\n");
					}

					const formattedResults = records
						.map((record, index) => {
							const fields = Object.entries(record)
								.map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
								.join("\n");
							return `Result ${index + 1}:\n${fields}`;
						})
						.join("\n\n");

					return [
						`Request ID: ${requestId}`,
						`Query Results (${records.length} records):`,
						"",
						formattedResults,
					].join("\n");
				});
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Graph query", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});

	server.addTool({
		name: "chroma_query" as const,
		description: "Query a Chroma collection with a text query",
		parameters: z.object({
			collection: z.string().describe("The collection name to query"),
			queryTexts: z.array(z.string()).min(1).describe("Array of query texts"),
			nResults: z
				.number()
				.int()
				.min(1)
				.max(50)
				.default(5)
				.describe("Number of results to return"),
			format: outputFormatSchema,
		}),
		annotations: {
			title: "Query Vector Database",
			readOnlyHint: true,
			openWorldHint: true,
		},
		execute: async ({ collection, queryTexts, nResults, format }) => {
			const col = await chroma.getOrCreateCollection({
				name: collection,
				embeddingFunction,
			});
			const res = await col.query({
				queryTexts,
				nResults,
			});

			const requestId = generateId("chroma_query");
			const payload = {
				requestId,
				collection,
				results: res,
			};

			return formatTextOrJson(format, payload, () => {
				const formattedResults = queryTexts
					.map((query, queryIndex) => {
						const items = res.ids[queryIndex]?.map((id, idx) => {
							const distance = res.distances?.[queryIndex]?.[idx] ?? "N/A";
							const document = res.documents?.[queryIndex]?.[idx] ?? "N/A";
							return [
								`  - ID: ${id}`,
								`    Distance: ${distance}`,
								`    Document: ${document}`,
							].join("\n");
						});

						return [
							`Query "${query}":`,
							items?.join("\n") ?? "  No results",
						].join("\n");
					})
					.join("\n\n");

				return [
					`Request ID: ${requestId}`,
					`Vector Search Results from collection "${collection}":`,
					"",
					formattedResults,
				].join("\n");
			});
		},
	});

	server.addTool({
		name: "chroma_add" as const,
		description: "Add documents to a Chroma collection",
		parameters: z.object({
			collection: z.string().describe("The collection name"),
			documents: z.array(z.string()).describe("Array of document texts to add"),
			metadatas: z
				.array(
					z.record(
						z.string(),
						z.union([z.string(), z.number(), z.boolean(), z.null()]),
					),
				)
				.optional()
				.describe("Optional metadata for each document"),
			ids: z
				.array(z.string())
				.optional()
				.describe(
					"Optional IDs for documents (auto-generated if not provided)",
				),
		}),
		annotations: {
			title: "Add Documents to Vector DB",
			readOnlyHint: false,
			destructiveHint: false,
			openWorldHint: true,
		},
		execute: async ({ collection, documents, metadatas, ids }) => {
			const requestId = generateId("chroma_add");
			try {
				const col = await chroma.getOrCreateCollection({
					name: collection,
					embeddingFunction,
				});

				const recordIds = ids ?? documents.map(() => generateId("doc"));

				await col.add({
					documents,
					metadatas: metadatas ?? [],
					ids: recordIds,
				});

				return [
					`Request ID: ${requestId}`,
					`✅ Added ${documents.length} document(s) to collection "${collection}"`,
					`- IDs: ${recordIds.join(", ")}`,
					`- Metadata: ${metadatas ? "included" : "none"}`,
				].join("\n");
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Chroma add", error),
				].join("\n");
			}
		},
	});
}
