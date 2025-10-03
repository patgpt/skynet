/**
 * Memgraph (Neo4j) Graph Database Client
 */
import neo4j from "neo4j-driver";

const BOLT_URL = process.env.MEMGRAPH_BOLT_URL ?? "bolt://localhost:7687";
const NEO_USER = process.env.MEMGRAPH_USER ?? "";
const NEO_PASS = process.env.MEMGRAPH_PASS ?? "";

/**
 * Neo4j driver instance for Memgraph graph database operations.
 * Used for storing interaction history, relationships, and user profiles.
 */
export const driver = neo4j.driver(BOLT_URL, neo4j.auth.basic(NEO_USER, NEO_PASS));

/**
 * Helper to execute a Cypher query with proper session management
 */
export async function executeQuery<T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const session = driver.session();
  try {
    const res = await session.run(cypher, params);
    return res.records.map(r => r.toObject()) as T[];
  } finally {
    await session.close();
  }
}

/**
 * Close the driver connection (for cleanup)
 */
export async function closeDriver() {
  await driver.close();
}
