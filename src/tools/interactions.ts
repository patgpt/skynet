import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { driver } from "../db/memgraph.js";
import { queries } from "../db/queries.js";
import { formatErrorMessage } from "../utils/errors.js";
import { formatTextOrJson } from "../utils/format.js";
import { generateId } from "../utils/id.js";
import { normalizeNeo4jRecord } from "../utils/neo4j.js";
import { outputFormatSchema } from "../utils/schemas.js";

/**
 * @name registerInteractionTools
 * @description Registers the interaction-related Model Context Protocol tools that manage graph persistence, analytics, and relationship building.
 * @param server - FastMCP server instance used to expose the tools.
 * @see https://patgpt.github.io/skynet/guide/tools
 */
export function registerInteractionTools(server: FastMCP) {
	/**
	 * @name interaction_store
	 * @description Store a user interaction in Memgraph, linking entities, topics, and cross-interaction relationships.
	 * @returns Multiline status summary including the generated request and interaction identifiers.
	 * @see https://patgpt.github.io/skynet/guide/tools#interactions
	 */
	server.addTool({
		name: "interaction_store",
		description:
			"Store an interaction in the graph database with entities, topics, and relationships",
		parameters: z.object({
			user: z.string(),
			input: z.string(),
			output: z.string(),
			intent: z.string().optional(),
			sentiment: z
				.enum(["positive", "negative", "neutral", "mixed"])
				.optional(),
			entities: z.array(z.string()).default([]),
			topics: z.array(z.string()).default([]),
			previousInteractionId: z.string().optional(),
		}),
		execute: async (params) => {
			const requestId = generateId("interaction_store");
			const {
				user,
				input,
				output,
				intent,
				sentiment,
				entities,
				topics,
				previousInteractionId,
			} = params;
			const session = driver.session();
			try {
				const id = generateId("int");

				await session.run(queries.interactions.createInteraction, {
					id,
					user,
					input,
					output,
					intent,
					sentiment,
					entities,
					topics,
				});

				if (previousInteractionId) {
					await session.run(queries.interactions.follows, {
						prevId: previousInteractionId,
						currentId: id,
					});
				}

				await session.run(queries.interactions.initiated, { user, id });

				for (const topic of topics) {
					await session.run(queries.interactions.about, { topic, id });
				}

				return [
					`Request ID: ${requestId}`,
					`Stored interaction with ID: ${id}`,
					`User: ${user}`,
					`Topics: ${topics.join(", ") || "none"}`,
				].join("\n");
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Interaction store", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});

	/**
	 * @name interaction_getContext
	 * @description Retrieve recent interaction history for a user with optional topic filtering and flexible output formatting.
	 * @returns Text or JSON response summarizing the request parameters and matching interactions.
	 * @see https://patgpt.github.io/skynet/guide/tools#interactions
	 */
	server.addTool({
		name: "interaction_getContext",
		description:
			"Retrieve recent interaction history for a user with optional filtering by topics/entities",
		parameters: z.object({
			user: z.string(),
			limit: z.number().int().default(10),
			days: z.number().int().default(7),
			topics: z.array(z.string()).optional(),
			format: outputFormatSchema,
		}),
		execute: async ({ user, limit, days, topics, format }) => {
			const requestId = generateId("interaction_getContext");
			const session = driver.session();
			try {
				const query =
					topics && topics.length > 0
						? queries.interactions.getContextWithTopics
						: queries.interactions.getContext;

				const res = await session.run(query, { user, days, limit, topics });
				const results = res.records.map((record) =>
					normalizeNeo4jRecord(record.toObject()),
				);

				const payload = {
					requestId,
					user,
					limit,
					days,
					topics: topics ?? [],
					results,
				};

				return formatTextOrJson(format, payload, () => {
					const lines = [
						`Request ID: ${requestId}`,
						`Recent interactions for "${user}" (last ${days} days, limit ${limit})`,
					];

					if (topics && topics.length > 0) {
						lines.push(`Filtered topics: ${topics.join(", ")}`);
					}

					if (results.length === 0) {
						lines.push("No interactions found.");
					} else {
						lines.push("", "Interactions:");
						results.forEach((result, index) => {
							lines.push(` ${index + 1}. ${JSON.stringify(result)}`);
						});
					}

					return lines.join("\n");
				});
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Interaction get context", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});

	/**
	 * @name interaction_findRelated
	 * @description Find interactions related to supplied topics, entities, or user context using graph traversal.
	 * @returns Text or JSON payload describing related interactions and applied filters.
	 * @see https://patgpt.github.io/skynet/guide/tools#interactions
	 */
	server.addTool({
		name: "interaction_findRelated",
		description:
			"Find interactions related to current topics or entities using graph traversal",
		parameters: z.object({
			topics: z.array(z.string()).optional(),
			entities: z.array(z.string()).optional(),
			user: z.string().optional(),
			limit: z.number().int().default(5),
			format: outputFormatSchema,
		}),
		execute: async ({ topics, entities, user, limit, format }) => {
			const requestId = generateId("interaction_findRelated");
			const session = driver.session();
			try {
				const conditions: string[] = [];

				if (topics && topics.length > 0) {
					conditions.push(`t.name IN $topics`);
				}

				if (user) {
					conditions.push(`i.user = $user`);
				}

				if (entities && entities.length > 0) {
					conditions.push(
						`any(entity IN i.entities WHERE entity IN $entities)`,
					);
				}

				const query = queries.interactions.findRelated(
					conditions.join(" AND "),
				);

				const res = await session.run(query, { topics, entities, user, limit });
				const results = res.records.map((record) =>
					normalizeNeo4jRecord(record.toObject()),
				);

				const payload = {
					requestId,
					topics: topics ?? [],
					entities: entities ?? [],
					user: user ?? null,
					limit,
					results,
				};

				return formatTextOrJson(format, payload, () => {
					const lines = [`Request ID: ${requestId}`, "Related interactions:"];

					if (results.length === 0) {
						lines.push("None found.");
					} else {
						results.forEach((result, index) => {
							lines.push(` ${index + 1}. ${JSON.stringify(result)}`);
						});
					}

					return lines.join("\n");
				});
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Interaction find related", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});

	/**
	 * @name user_getProfile
	 * @description Retrieve or create a user profile, capturing interaction counts and favorite topics.
	 * @returns Text or JSON response describing the profile data and whether it was newly created.
	 * @see https://patgpt.github.io/skynet/guide/tools#interactions
	 */
	server.addTool({
		name: "user_getProfile",
		description:
			"Retrieve or create a user profile with preferences and interaction patterns",
		parameters: z.object({
			user: z.string(),
			format: outputFormatSchema,
		}),
		execute: async ({ user, format }) => {
			const requestId = generateId("user_getProfile");
			const session = driver.session();
			try {
				const userRes = await session.run(queries.interactions.getUserProfile, {
					user,
				});

				if (userRes.records.length === 0) {
					await session.run(queries.interactions.createUser, { user });
					const payload = {
						requestId,
						user,
						interactionCount: 0,
						isNew: true,
						favoriteTopics: [] as Array<{ topic: string; frequency: number }>,
					};

					return formatTextOrJson(format, payload, () =>
						[
							`Request ID: ${requestId}`,
							`Created new profile for "${user}".`,
						].join("\n"),
					);
				}

				const topicsRes = await session.run(
					queries.interactions.favoriteTopics,
					{ user },
				);

				const interactionCountRaw = userRes.records[0]?.get("interactionCount");
				const interactionCount =
					typeof (interactionCountRaw as { toNumber?: () => number })
						?.toNumber === "function"
						? (interactionCountRaw as { toNumber: () => number }).toNumber()
						: Number(interactionCountRaw ?? 0);

				const favoriteTopics = topicsRes.records.map((record) => {
					const normalized = normalizeNeo4jRecord(record.toObject());
					return {
						topic: String(normalized.topic ?? ""),
						frequency: Number(normalized.frequency ?? 0),
					};
				});

				const payload = {
					requestId,
					user,
					interactionCount,
					isNew: false,
					favoriteTopics,
				};

				return formatTextOrJson(format, payload, () => {
					const lines = [
						`Request ID: ${requestId}`,
						`Profile for "${user}"`,
						`- Interaction count: ${interactionCount}`,
					];

					if (favoriteTopics.length === 0) {
						lines.push("- No favorite topics identified yet.");
					} else {
						lines.push("- Favorite topics:");
						favoriteTopics.forEach((topic) => {
							lines.push(
								`  • ${topic.topic || "(unknown)"} (${topic.frequency})`,
							);
						});
					}

					return lines.join("\n");
				});
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("User get profile", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});

	/**
	 * @name graph_createRelationship
	 * @description Create a typed relationship between two interactions, optionally capturing metadata such as similarity scores.
	 * @returns Confirmation message noting the relationship type and participating interaction IDs.
	 * @see https://patgpt.github.io/skynet/guide/tools#interactions
	 */
	server.addTool({
		name: "graph_createRelationship",
		description:
			"Create a custom relationship between two interactions or entities",
		parameters: z.object({
			fromId: z.string(),
			toId: z.string(),
			relationshipType: z.enum([
				"RELATED_TO",
				"CONTRADICTS",
				"BUILDS_ON",
				"REFERENCES",
				"SIMILAR_TO",
			]),
			properties: z
				.object({
					similarity: z.number().optional(),
					reason: z.string().optional(),
				})
				.optional(),
		}),
		execute: async ({ fromId, toId, relationshipType, properties }) => {
			const requestId = generateId("graph_createRelationship");
			const session = driver.session();
			try {
				await session.run(
					queries.interactions.createRelationship(relationshipType),
					{ fromId, toId, props: properties || {} },
				);

				return [
					`Request ID: ${requestId}`,
					`Created ${relationshipType} relationship from ${fromId} to ${toId}`,
				].join("\n");
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Graph create relationship", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});

	/**
	 * @name analytics_getInsights
	 * @description Analyze interaction patterns to calculate aggregated metrics and trending topics over a configurable time window.
	 * @returns Text or JSON summary containing analytics metadata, aggregated counts, and trending topics.
	 * @see https://patgpt.github.io/skynet/guide/tools#interactions
	 */
	server.addTool({
		name: "analytics_getInsights",
		description:
			"Analyze interaction patterns and extract meta-insights about conversations",
		parameters: z.object({
			user: z.string().optional(),
			days: z.number().int().default(30),
			format: outputFormatSchema,
		}),
		execute: async ({ user, days, format }) => {
			const requestId = generateId("analytics_getInsights");
			const session = driver.session();
			try {
				const userFilter = user ? `{user: $user}` : ``;

				const patternsRes = await session.run(
					queries.interactions.getInsights(userFilter),
					{ user, days },
				);

				const topicsRes = await session.run(
					queries.interactions.topicTrends(userFilter),
					{ user, days },
				);

				const summaryRecord = patternsRes.records[0]?.toObject() ?? {};
				const summary = normalizeNeo4jRecord(summaryRecord);
				const trendingTopics = topicsRes.records.map((record) =>
					normalizeNeo4jRecord(record.toObject()),
				);

				const payload = {
					requestId,
					period: `Last ${days} days`,
					user: user || "all users",
					summary,
					trendingTopics,
				};

				return formatTextOrJson(format, payload, () => {
					const lines = [
						`Request ID: ${requestId}`,
						`Insights for ${user || "all users"} (last ${days} days)`,
					];

					if (Object.keys(summary).length > 0) {
						lines.push("Summary:", JSON.stringify(summary));
					}

					if (trendingTopics.length === 0) {
						lines.push("No trending topics detected.");
					} else {
						lines.push("Trending topics:");
						trendingTopics.forEach((topic, index) => {
							lines.push(` ${index + 1}. ${JSON.stringify(topic)}`);
						});
					}

					return lines.join("\n");
				});
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Analytics get insights", error),
				].join("\n");
			} finally {
				await session.close();
			}
		},
	});
}
