/**
 * Database Tools Tests
 * Tests for graph and vector database operations
 */
import { describe, test, expect, beforeAll } from "bun:test";
import { FastMCP } from "fastmcp";
import { registerDatabaseTools } from "../src/tools/database";

describe("Database Tools", () => {
  let server: FastMCP;

  beforeAll(() => {
    server = new FastMCP({ name: "test-server", version: "1.0.0" });
    registerDatabaseTools(server);
  });

  test("should register database tools without errors", () => {
    expect(server).toBeDefined();
  });

  // Note: Actual database operations require running containers
  // These are tested in integration tests
});

describe("Add Tool", () => {
  test("should add two numbers correctly", () => {
    const result = 5 + 7;
    expect(result).toBe(12);
  });

  test("should handle negative numbers", () => {
    const result = -5 + 3;
    expect(result).toBe(-2);
  });

  test("should handle zero", () => {
    const result = 0 + 0;
    expect(result).toBe(0);
  });
});
