/**
 * Infrastructure Tools - Docker container management
 */
import { z } from "zod";
import type { FastMCP } from "fastmcp";
import { docker, NETWORK_NAME, CONTAINERS, VOLUMES } from "../db/docker.js";

/**
 * Register all infrastructure tools with the FastMCP server
 */
export function registerInfrastructureTools(server: FastMCP) {
  /**
   * Start or ensure Memgraph and Chroma Docker containers are running.
   */
  server.addTool({
    name: "stack_up",
    description: "Start (or ensure) local Memgraph and Chroma containers",
    parameters: z.object({
      memgraphImage: z.string().default("memgraph/memgraph:latest"),
      chromaImage: z.string().default("chromadb/chroma:latest"),
      memgraphPort: z.number().int().default(7687),
      chromaPort: z.number().int().default(8000),
    }),
    execute: async (args) => {
      const ensureNetwork = async () => {
        const nets = await docker.listNetworks({ filters: { name: [NETWORK_NAME] } });
        if (!nets.length) await docker.createNetwork({ Name: NETWORK_NAME, Driver: "bridge" });
      };

      const ensureVolume = async (name: string) => {
        try {
          await docker.getVolume(name).inspect();
        } catch {
          await docker.createVolume({ Name: name });
        }
      };

      const up = async (
        name: string,
        image: string,
        ports: Array<{ host: number; container: number }>,
        mounts: Array<{ source: string; target: string; type?: "volume" | "bind" }>,
        env: string[] = []
      ) => {
        let c;
        try {
          c = docker.getContainer(name);
          await c.inspect();
        } catch {
          c = await docker.createContainer({
            name,
            Image: image,
            Env: env,
            HostConfig: {
              Mounts: mounts.map(m => ({ Source: m.source, Target: m.target, Type: m.type ?? "volume" })),
              PortBindings: Object.fromEntries(ports.map(p => [`${p.container}/tcp`, [{ HostPort: String(p.host) }]])),
              RestartPolicy: { Name: "unless-stopped" },
            },
            ExposedPorts: Object.fromEntries(ports.map(p => [`${p.container}/tcp`, {}])),
            NetworkingConfig: { EndpointsConfig: { [NETWORK_NAME]: {} } },
          });
        }
        const info = await c.inspect();
        if (!info.State.Running) await c.start();
      };

      await ensureNetwork();
      await Promise.all([ensureVolume(VOLUMES.MEMGRAPH), ensureVolume(VOLUMES.CHROMA)]);

      await up(
        CONTAINERS.MEMGRAPH,
        args.memgraphImage,
        [{ host: args.memgraphPort, container: 7687 }],
        [{ source: VOLUMES.MEMGRAPH, target: "/var/lib/memgraph", type: "volume" }]
      );

      await up(
        CONTAINERS.CHROMA,
        args.chromaImage,
        [{ host: args.chromaPort, container: 8000 }],
        [{ source: VOLUMES.CHROMA, target: "/data", type: "volume" }],
        [
          "CHROMA_SERVER_HOST=0.0.0.0",
          `CHROMA_SERVER_HTTP_PORT=${args.chromaPort}`,
          "PERSIST_DIRECTORY=/data",
          "ANONYMIZED_TELEMETRY=False",
        ]
      );

      return "Containers started successfully";
    }
  });

  /**
   * Stop and remove Memgraph and Chroma Docker containers.
   */
  server.addTool({
    name: "stack_down",
    description: "Stop and remove the Memgraph and Chroma containers",
    parameters: z.object({ force: z.boolean().default(true) }),
    execute: async ({ force }) => {
      const rm = async (name: string) => {
        try {
          const c = docker.getContainer(name);
          await c.stop();
          await c.remove({ force });
        } catch {
          // Container already removed or doesn't exist
        }
      };
      await Promise.all([rm(CONTAINERS.CHROMA), rm(CONTAINERS.MEMGRAPH)]);
      return "Containers stopped and removed";
    }
  });

  /**
   * Get current running status and IDs of Memgraph and Chroma containers.
   */
  server.addTool({
    name: "stack_status",
    description: "Return running state and ids for both containers",
    parameters: z.object({}),
    execute: async () => {
      const stat = async (name: string) => {
        try {
          const i = await docker.getContainer(name).inspect();
          return { name, running: i.State.Running, id: i.Id.slice(0, 12) };
        } catch {
          return { name, running: false };
        }
      };
      return JSON.stringify({
        memgraph: await stat(CONTAINERS.MEMGRAPH),
        chroma: await stat(CONTAINERS.CHROMA),
      }, null, 2);
    }
  });
}
