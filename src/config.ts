import { z } from "zod";

const envSchema = z.object({
	MEMGRAPH_BOLT_URL: z.string().trim().default("bolt://localhost:7687"),
	MEMGRAPH_USER: z.string().optional().default(""),
	MEMGRAPH_PASS: z.string().optional().default(""),
	CHROMA_URL: z.string().trim().default("http://localhost:8000"),
	CHROMA_DEFAULT_COLLECTION: z.string().trim().default("skynet_memories"),
	DOCKER_NETWORK: z.string().trim().default("mcp-local-net"),
	DOCKER_MEMGRAPH_CONTAINER: z.string().trim().default("mcp-memgraph"),
	DOCKER_MEMGRAPH_LAB_CONTAINER: z.string().trim().default("mcp-memgraph-lab"),
	DOCKER_CHROMA_CONTAINER: z.string().trim().default("mcp-chroma"),
	DOCKER_MEMGRAPH_VOLUME: z.string().trim().default("memgraph-data"),
	DOCKER_CHROMA_VOLUME: z.string().trim().default("chroma-data"),
	DOCKER_MEMGRAPH_IMAGE: z.string().trim().default("memgraph/memgraph:latest"),
	DOCKER_MEMGRAPH_LAB_IMAGE: z.string().trim().default("memgraph/lab:latest"),
	DOCKER_CHROMA_IMAGE: z.string().trim().default("chromadb/chroma:latest"),
	DOCKER_MEMGRAPH_PORT: z.coerce.number().int().positive().default(7687),
	DOCKER_MEMGRAPH_LAB_PORT: z.coerce.number().int().positive().default(3000),
	DOCKER_CHROMA_PORT: z.coerce.number().int().positive().default(8000),
	DOCKER_HOST: z.string().trim().optional(),
	DOCKER_SOCKET_PATH: z.string().trim().optional(),
});

const env = envSchema.parse(process.env);

const chromaUrl = new URL(env.CHROMA_URL);

/**
 * Application-wide configuration derived from environment variables with
 * schema validation and sensible defaults for local development.
 */
export const config = {
	memgraph: {
		boltUrl: env.MEMGRAPH_BOLT_URL,
		credentials: {
			user: env.MEMGRAPH_USER,
			password: env.MEMGRAPH_PASS,
		},
	},
	chroma: {
		url: chromaUrl,
		defaultCollection: env.CHROMA_DEFAULT_COLLECTION,
	},
	docker: {
		network: env.DOCKER_NETWORK,
		containers: {
			memgraph: env.DOCKER_MEMGRAPH_CONTAINER,
			memgraphLab: env.DOCKER_MEMGRAPH_LAB_CONTAINER,
			chroma: env.DOCKER_CHROMA_CONTAINER,
		},
		volumes: {
			memgraph: env.DOCKER_MEMGRAPH_VOLUME,
			chroma: env.DOCKER_CHROMA_VOLUME,
		},
		images: {
			memgraph: env.DOCKER_MEMGRAPH_IMAGE,
			memgraphLab: env.DOCKER_MEMGRAPH_LAB_IMAGE,
			chroma: env.DOCKER_CHROMA_IMAGE,
		},
		ports: {
			memgraph: env.DOCKER_MEMGRAPH_PORT,
			memgraphLab: env.DOCKER_MEMGRAPH_LAB_PORT,
			chroma: env.DOCKER_CHROMA_PORT,
		},
		connection: {
			host: env.DOCKER_HOST,
			socketPath: env.DOCKER_SOCKET_PATH,
		},
	},
} as const;
for (const [key, value] of Object.entries(config)) {
	if (typeof value === "string" && value === "") {
		throw new Error(`Configuration error: ${key} cannot be an empty string.`);
	}
}
export type AppConfig = typeof config;
