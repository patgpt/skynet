/**
 * Docker client for container management
 */
import Docker from "dockerode";

/**
 * Docker client instance for container management.
 * Automatically detects Windows (named pipe) vs Unix (socket) Docker daemon.
 */
export const docker = new Docker(
	process.platform === "win32"
		? { host: process.env.DOCKER_HOST ?? "npipe:////./pipe/docker_engine" }
		: { socketPath: "/var/run/docker.sock" },
);

/**
 * Network name for MCP containers
 */
export const NETWORK_NAME = "mcp-local-net";

/**
 * Container names
 */
export const CONTAINERS = {
	MEMGRAPH: "mcp-memgraph",
	CHROMA: "mcp-chroma",
} as const;

/**
 * Volume names
 */
export const VOLUMES = {
	MEMGRAPH: "memgraph-data",
	CHROMA: "chroma-data",
} as const;
