import { FastMCP } from "fastmcp";
import { instructions } from "./instructions.js";
import { appVersion } from "./version.js";
import { getLogger } from "./utils/logger.js";

/**
 * @name createServer
 * @description Creates and configures the Skynet FastMCP server with core health checks, logging, and instruction prompts.
 * @returns Configured FastMCP server instance ready for tool registration.
 * @see https://patgpt.github.io/skynet/guide/setup
 */
export function createServer(): FastMCP {
	const log = getLogger({ scope: "fastmcp" });
	return new FastMCP({
		name: "Skynet",

		version: appVersion,
		health: {
			enabled: true,
			message: "Skynet MCP Server is healthy",
			path: "/health",
			status: 200,
		},
		logger: {
			debug: (msg: string) => log.debug(msg),
			info: (msg: string) => log.info(msg),
			warn: (msg: string) => log.warn(msg),
			error: (msg: string) => log.error(msg),
			log(msg: string) {
				log.info(msg);
			},
		},
		instructions,
	});
}
