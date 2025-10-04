/**
 * Memgraph (Neo4j) Graph Database Client
 */
import neo4j from "neo4j-driver";
import { config } from "../config.js";

/**
 * @name Memgraph Bolt Driver
 * @description Configured Neo4j Bolt driver instance used to connect to the Memgraph graph database for storing interactions, relationships, and user profiles.
 * @see https://docs.memgraph.com/data-processing/clients/javascript
 */
export const driver = neo4j.driver(
	config.memgraph.boltUrl,
	neo4j.auth.basic(
		config.memgraph.credentials.user,
		config.memgraph.credentials.password,
	),
);

/**
 * @name executeQuery
 * @description Runs a Cypher query against Memgraph using either a managed session or an existing transaction for proper lifecycle handling.
 * @template T Mapped record shape returned to the caller.
 * @param cypher - Cypher query text to execute.
 * @param params - Named parameters supplied to the query.
 * @param tx - Optional transaction to reuse when batching operations.
 * @returns Result records converted to plain objects typed as {@link T}.
 * @see https://docs.memgraph.com/data-processing/clients/javascript#run-a-cypher-query
 */
export async function executeQuery<T = unknown>(
	cypher: string,
	params: Record<string, unknown> = {},
	tx?: import("neo4j-driver").Transaction,
): Promise<T[]> {
	if (tx) {
		// Use provided transaction
		const res = await tx.run(cypher, params);
		return res.records.map((r) => r.toObject()) as T[];
	}

	// Create new session for standalone query
	const session = driver.session();
	try {
		const res = await session.run(cypher, params);
		return res.records.map((r) => r.toObject()) as T[];
	} catch (error) {
		throw error;
	} finally {
		await session.close();
	}
}

/**
 * @name closeDriver
 * @description Gracefully closes the shared Memgraph driver connection to release sockets and other resources.
 * @see https://docs.memgraph.com/data-processing/clients/javascript#close-the-connection
 */
export async function closeDriver() {
	await driver.close();
}
