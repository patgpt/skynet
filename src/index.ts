#!/usr/bin/env node
/**
 * Skynet MCP Server
 *
 * An advanced Model Context Protocol server with persistent memory and autonomous learning.
 * Combines graph database (Memgraph) for relationship tracking and vector database (Chroma)
 * for semantic memory storage.
 *
 * @module skynet
 * @version See package.json
 */

import { createServer } from "./server.js";
import { registerCognitiveTools } from "./tools/cognitive.js";
import { registerDatabaseTools } from "./tools/database.js";
import { registerInfrastructureTools } from "./tools/infrastructure.js";
import { registerInteractionTools } from "./tools/interactions.js";
import { registerMemoryTools } from "./tools/memory.js";

/**
 * FastMCP server instance - the core Model Context Protocol server.
 * Exposes tools and prompts for AI interaction with persistent memory.
 */
export const skynet = createServer();

registerInfrastructureTools(skynet);
registerDatabaseTools(skynet);
registerMemoryTools(skynet);
registerInteractionTools(skynet);
registerCognitiveTools(skynet);

// Start the server with error handling
try {
	skynet.start({
		transportType: "stdio",
	});
} catch (error) {
	console.error("[FATAL] Server failed to start:", error);
	process.exit(1);
}

function handleExit(error: Error) {
	console.error("[FATAL]", error);
	process.exit(1);
}

// Handle uncaught errors
process.on("uncaughtException", handleExit);
process.on("unhandledRejection", handleExit);
