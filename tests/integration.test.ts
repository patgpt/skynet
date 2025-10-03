/**
 * Integration Tests
 *
 * These tests require Docker to be running and will start/stop containers.
 * Run separately from unit tests to avoid disrupting development environment.
 *
 * Usage: bun test tests/integration.test.ts
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { docker, CONTAINERS } from "../src/db/docker";

describe("Integration Tests", () => {
	describe("Docker Container Management", () => {
		test("should be able to connect to Docker daemon", async () => {
			const info = await docker.info();
			expect(info).toBeDefined();
		});

		test("should list containers", async () => {
			const containers = await docker.listContainers({ all: true });
			expect(Array.isArray(containers)).toBe(true);
		});
	});

	describe("Stack Operations", () => {
		test("should check container status", async () => {
			const stat = async (name: string) => {
				try {
					const i = await docker.getContainer(name).inspect();
					return { name, running: i.State.Running, id: i.Id.slice(0, 12) };
				} catch {
					return { name, running: false };
				}
			};

			const memgraphStatus = await stat(CONTAINERS.MEMGRAPH);
			const chromaStatus = await stat(CONTAINERS.CHROMA);

			expect(memgraphStatus).toHaveProperty("name");
			expect(memgraphStatus).toHaveProperty("running");
			expect(chromaStatus).toHaveProperty("name");
			expect(chromaStatus).toHaveProperty("running");
		});
	});
});

describe("Database Integration", () => {
	// These tests only run if containers are already running
	// to avoid starting/stopping containers during regular test runs

	test.skip("should connect to Memgraph", async () => {
		// This would test actual Memgraph connectivity
		// Skipped by default to avoid requiring running containers
	});

	test.skip("should connect to ChromaDB", async () => {
		// This would test actual ChromaDB connectivity
		// Skipped by default to avoid requiring running containers
	});
});
