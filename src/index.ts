/**
 * Skynet MCP Server
 *
 * An advanced Model Context Protocol server with persistent memory and autonomous learning.
 * Combines graph database (Memgraph) for relationship tracking and vector database (Chroma)
 * for semantic memory storage.
 *
 * @module skynet-mcp
 * @version 1.0.0
 */

import { FastMCP } from "fastmcp";
import { registerInfrastructureTools } from "./tools/infrastructure.js";
import { registerDatabaseTools } from "./tools/database.js";
import { registerMemoryTools } from "./tools/memory.js";
import { registerInteractionTools } from "./tools/interactions.js";
import { registerCognitiveTools } from "./tools/cognitive.js";

/**
 * FastMCP server instance - the core Model Context Protocol server.
 * Exposes tools and prompts for AI interaction with persistent memory.
 */
const server = new FastMCP({
	name: "Skynet",
	version: "1.0.0",
});

// Register all tool categories
registerInfrastructureTools(server);
registerDatabaseTools(server);
registerMemoryTools(server);
registerInteractionTools(server);
registerCognitiveTools(server);

// Export the server for use by the runtime
export default server;
