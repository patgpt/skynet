/**
 * Infrastructure Tools - Docker container management
 *
 * Refactored to follow FastMCP best practices:
 * - Export tool definitions instead of register function
 * - Extract helper functions for testability
 * - Use proper return formats (no JSON.stringify)
 * - Add annotations
 */
import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { config } from "../config.js";
import { CONTAINERS, docker, NETWORK_NAME, VOLUMES } from "../db/docker.js";
import { formatErrorMessage } from "../utils/errors.js";
import { formatTextOrJson } from "../utils/format.js";
import { generateId } from "../utils/id.js";
import { outputFormatSchema } from "../utils/schemas.js";

// Helper functions extracted for testability and reusability
export async function ensureNetwork(): Promise<void> {
	const nets = await docker.listNetworks({
		filters: { name: [NETWORK_NAME] },
	});
	if (!nets.length) {
		await docker.createNetwork({ Name: NETWORK_NAME, Driver: "bridge" });
	}
}

export async function ensureVolume(name: string): Promise<void> {
	try {
		await docker.getVolume(name).inspect();
	} catch {
		await docker.createVolume({ Name: name });
	}
}

export async function startContainer(
	name: string,
	image: string,
	ports: Array<{ host: number; container: number }>,
	mounts: Array<{
		source: string;
		target: string;
		type?: "volume" | "bind";
	}>,
	env: string[] = [],
): Promise<void> {
	try {
		let c: import("dockerode").Container;
		try {
			c = docker.getContainer(name);
			await c.inspect();
		} catch {
			c = await docker.createContainer({
				name,
				Image: image,
				Env: env,
				HostConfig: {
					Mounts: mounts.map((m) => ({
						Source: m.source,
						Target: m.target,
						Type: m.type ?? "volume",
					})),
					PortBindings: Object.fromEntries(
						ports.map((p) => [
							`${p.container}/tcp`,
							[{ HostPort: String(p.host) }],
						]),
					),
					RestartPolicy: { Name: "unless-stopped" },
				},
				ExposedPorts: Object.fromEntries(
					ports.map((p) => [`${p.container}/tcp`, {}]),
				),
				NetworkingConfig: { EndpointsConfig: { [NETWORK_NAME]: {} } },
			});
		}
		const info = await c.inspect();
		if (!info.State.Running) await c.start();
	} catch (error) {
		console.error(`Failed to start container ${name}:`, error);
		throw error;
	}
}

// TODO: THIS IS KINDA STUPID - We should not let let it remove anything without double checking with this user
export async function stopAndRemoveContainer(
	name: string,
	force = true,
): Promise<boolean> {
	try {
		const container = docker.getContainer(name);
		await container.inspect();
		try {
			await container.stop();
		} catch (error) {
			const statusCode = (error as { statusCode?: number })?.statusCode;
			if (statusCode !== 304 && statusCode !== 404) {
				throw error;
			}
		}
		await container.remove({ force });
		return true;
	} catch (error) {
		const statusCode = (error as { statusCode?: number })?.statusCode;
		if (statusCode === 404) {
			console.warn(`Container ${name} not found during teardown.`);
			return false;
		}
		console.warn(`Could not remove container ${name}:`, error);
		throw error;
	}
}

export async function getContainerStatus(name: string): Promise<{
	name: string;
	running: boolean;
	id?: string;
}> {
	try {
		const i = await docker.getContainer(name).inspect();
		return { name, running: i.State.Running, id: i.Id.slice(0, 12) };
	} catch {
		return { name, running: false };
	}
}

// Tool definitions following FastMCP best practices

export function registerInfrastructureTools(server: FastMCP) {
	const containerKeys = ["memgraph", "chroma"] as const;
	type ContainerKey = (typeof containerKeys)[number];

	server.addTool({
		name: "stack_up" as const,
		description: "Start (or ensure) local Memgraph and Chroma containers",
		parameters: z.object({
			memgraphImage: z.string().default(config.docker.images.memgraph),
			chromaImage: z.string().default(config.docker.images.chroma),
			memgraphPort: z.number().int().default(config.docker.ports.memgraph),
			chromaPort: z.number().int().default(config.docker.ports.chroma),
		}),
		annotations: {
			title: "Start Docker Stack",
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
		execute: async ({
			memgraphImage,
			chromaImage,
			memgraphPort,
			chromaPort,
		}) => {
			const requestId = generateId("stack_up");
			try {
				await ensureNetwork();
				await Promise.all([
					ensureVolume(VOLUMES.memgraph),
					ensureVolume(VOLUMES.chroma),
				]);

				await startContainer(
					CONTAINERS.memgraph,
					memgraphImage,
					[{ host: memgraphPort, container: 7687 }],
					[
						{
							source: VOLUMES.memgraph,
							target: "/var/lib/memgraph",
							type: "volume",
						},
					],
				);

				await startContainer(
					CONTAINERS.chroma,
					chromaImage,
					[{ host: chromaPort, container: 8000 }],
					[{ source: VOLUMES.chroma, target: "/data", type: "volume" }],
					[
						"CHROMA_SERVER_HOST=0.0.0.0",
						`CHROMA_SERVER_HTTP_PORT=${chromaPort}`,
						"PERSIST_DIRECTORY=/data",
						"ANONYMIZED_TELEMETRY=False",
					],
				);

				return [
					`Request ID: ${requestId}`,
					"✅ Docker stack started successfully",
					`- Memgraph: ${memgraphImage} on port ${memgraphPort}`,
					`- Chroma: ${chromaImage} on port ${chromaPort}`,
					`- Network: ${NETWORK_NAME}`,
					`- Volumes: ${VOLUMES.memgraph}, ${VOLUMES.chroma}`,
				].join("\n");
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Docker stack start", error),
				].join("\n");
			}
		},
	});

	const ContainerSelectorSchema = z.union([
		z.literal("all"),
		z.array(z.enum(containerKeys)).nonempty(),
	]);

	server.addTool({
		name: "stack_down" as const,
		description:
			"Stop and remove selected Memgraph and/or Chroma containers with explicit confirmation",
		parameters: z.object({
			containers: ContainerSelectorSchema,
			force: z.boolean().default(false),
			confirm: z
				.literal(true)
				.describe("You must pass true to acknowledge this destructive action"),
		}),
		annotations: {
			title: "Stop Docker Stack",
			readOnlyHint: false,
			destructiveHint: true,
			idempotentHint: true,
			openWorldHint: true,
		},
		execute: async ({ containers, force }) => {
			const requestId = generateId("stack_down");
			const targetKeys: ContainerKey[] =
				containers === "all" ? [...containerKeys] : containers;
			const targets = targetKeys.map((name) => CONTAINERS[name]);

			try {
				const results = await Promise.all(
					targets.map((containerName) =>
						stopAndRemoveContainer(containerName, force),
					),
				);
				const removed = targets.filter((_, index) => results[index]);
				const missing = targets.filter((_, index) => !results[index]);

				return [
					`Request ID: ${requestId}`,
					"🛑 Docker stack teardown complete",
					`- Containers removed: ${removed.length ? removed.join(", ") : "none"}`,
					missing.length
						? `- Containers not found: ${missing.join(", ")}`
						: undefined,
					`- Force stop: ${force}`,
					"⚠️ Named volumes are preserved; rerun stack_up to recreate containers if needed.",
				]
					.filter(Boolean)
					.join("\n");
			} catch (error) {
				return [
					`Request ID: ${requestId}`,
					formatErrorMessage("Docker stack teardown", error),
				].join("\n");
			}
		},
	});

	server.addTool({
		name: "stack_status" as const,
		description: "Return running state and ids for both containers",
		parameters: z.object({
			format: outputFormatSchema,
		}),
		annotations: {
			title: "Check Docker Stack Status",
			readOnlyHint: true,
			openWorldHint: true,
		},
		execute: async ({ format }) => {
			const requestId = generateId("stack_status");
			const memgraphStatus = await getContainerStatus(CONTAINERS.memgraph);
			const chromaStatus = await getContainerStatus(CONTAINERS.chroma);

			const payload = {
				requestId,
				memgraph: memgraphStatus,
				chroma: chromaStatus,
			};

			return formatTextOrJson(format, payload, () => {
				return [
					`Request ID: ${requestId}`,
					"Docker Stack Status:",
					"",
					`Memgraph:\n- Name: ${memgraphStatus.name}\n- Running: ${memgraphStatus.running}\n- ID: ${memgraphStatus.id || "N/A"}`,
					`Chroma:\n- Name: ${chromaStatus.name}\n- Running: ${chromaStatus.running}\n- ID: ${chromaStatus.id || "N/A"}`,
				].join("\n");
			});
		},
	});
}
