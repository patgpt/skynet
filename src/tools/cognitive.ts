/**
 * Cognitive Workflow Tools - Skynet's memory and reasoning system
 */
import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { driver } from "../db/memgraph.js";
import { queries } from "../db/queries.js";
import { formatErrorMessage } from "../utils/errors.js";
import { formatTextOrJson } from "../utils/format.js";
import { generateId } from "../utils/id.js";
import { normalizeNeo4jValue } from "../utils/neo4j.js";
import { outputFormatSchema } from "../utils/schemas.js";

// Helper functions extracted for testability
export function extractTopics(input: string, limit = 5): string[] {
	const stopWords = [
		"the",
		"a",
		"an",
		"and",
		"or",
		"but",
		"in",
		"on",
		"at",
		"to",
		"for",
		"of",
		"with",
		"is",
		"are",
		"was",
		"were",
		"be",
		"been",
		"being",
	];
	const words = input.toLowerCase().match(/\b\w+\b/g) || [];
	return words
		.filter((w) => w.length > 3 && !stopWords.includes(w))
		.slice(0, limit);
}

export function registerCognitiveTools(server: FastMCP) {
	server.addTool({
		name: "skynet_think",
		description:
			"MANDATORY: Execute Skynet's cognitive workflow to process user input and retrieve context.",
		parameters: z.object({
			user: z.string(),
			input: z.string(),
			extractTopics: z.boolean().default(true),
			format: outputFormatSchema,
		}),
		annotations: {
			title: "Cognitive Processing",
			readOnlyHint: false,
		},
		execute: async ({
			user,
			input,
			extractTopics: shouldExtractTopics,
			format,
		}) => {
			const requestId = generateId("skynet_think");
			const session = driver.session();
			try {
				const profileRes = await session.run(queries.cognitive.getProfile, {
					user,
				});
				const interactionCountRaw =
					profileRes.records[0]?.get("interactionCount");
				const interactionCount =
					typeof (interactionCountRaw as { toNumber?: () => number })
						?.toNumber === "function"
						? (interactionCountRaw as { toNumber: () => number }).toNumber()
						: Number(interactionCountRaw ?? 0);
				const contextRes = await session.run(
					queries.cognitive.getRecentContext,
					{ user },
				);
				const lastIdRes = await session.run(
					queries.cognitive.getLastInteractionId,
					{ user },
				);
				const lastInteractionId = lastIdRes.records[0]?.get("id") ?? null;
				const topics = shouldExtractTopics ? extractTopics(input) : [];
				const recentInteractions = contextRes.records.map((record) => {
					const interaction = record.get("i");
					return normalizeNeo4jValue(interaction);
				});

				const payload = {
					requestId,
					user,
					interactionCount,
					isNewUser: interactionCount === 0,
					lastInteractionId,
					suggestedTopics: topics,
					recentInteractions,
				};

				return formatTextOrJson(format, payload, () => {
					const lines = [
						`Request ID: ${requestId}`,
						`Context summary for "${user}"`,
						`- Total interactions: ${interactionCount}`,
						`- New user: ${interactionCount === 0}`,
						`- Last interaction ID: ${lastInteractionId ?? "none"}`,
						`- Suggested topics: ${topics.length ? topics.join(", ") : "none"}`,
					];

					if (recentInteractions.length > 0) {
						lines.push("", "Recent interactions:");
						recentInteractions.forEach((interaction, index) => {
							lines.push(` ${index + 1}. ${JSON.stringify(interaction)}`);
						});
					} else {
						lines.push("", "No recent interactions available.");
					}

					return lines.join("\n");
				});
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Skynet cognitive workflow", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});
}
