/**
 * Infrastructure Tools Tests
 * Tests for Docker container management
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { FastMCP } from "fastmcp";
import { registerInfrastructureTools } from "../src/tools/infrastructure";

describe("Infrastructure Tools", () => {
  let server: FastMCP;

  beforeAll(() => {
    server = new FastMCP({ name: "test-server", version: "1.0.0" });
    registerInfrastructureTools(server);
  });

  test("should register infrastructure tools without errors", () => {
    // Test passes if registration doesn't throw
    expect(server).toBeDefined();
  });

  // Note: Actual container operations are tested in integration tests
  // to avoid disrupting the development environment
});
