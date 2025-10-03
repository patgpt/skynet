/**
 * Cognitive Workflow Tools Tests
 */
import { describe, test, expect, beforeAll } from "bun:test";
import { FastMCP } from "fastmcp";
import { registerCognitiveTools } from "../src/tools/cognitive";

describe("Cognitive Tools", () => {
	let server: FastMCP;

	beforeAll(() => {
		server = new FastMCP({ name: "test-server", version: "1.0.0" });
		registerCognitiveTools(server);
	});

	test("should register cognitive tools without errors", () => {
		expect(server).toBeDefined();
	});

	// Integration tests would require running containers
});
