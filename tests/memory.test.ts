/**
 * Memory Tools Tests
 */
import { describe, test, expect, beforeAll } from "bun:test";
import { FastMCP } from "fastmcp";
import { registerMemoryTools } from "../src/tools/memory";

describe("Memory Tools", () => {
	let server: FastMCP;

	beforeAll(() => {
		server = new FastMCP({ name: "test-server", version: "1.0.0" });
		registerMemoryTools(server);
	});

	test("should register memory tools without errors", () => {
		expect(server).toBeDefined();
	});

	// Integration tests would go here
});
