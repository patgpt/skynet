/**
 * Interaction Tools Tests
 */
import { describe, test, expect, beforeAll } from "bun:test";
import { FastMCP } from "fastmcp";
import { registerInteractionTools } from "../src/tools/interactions";

describe("Interaction Tools", () => {
  let server: FastMCP;

  beforeAll(() => {
    server = new FastMCP({ name: "test-server", version: "1.0.0" });
    registerInteractionTools(server);
  });

  test("should register interaction tools without errors", () => {
    expect(server).toBeDefined();
  });

  // Integration tests would require running containers
});
