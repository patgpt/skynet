/**
 * Database Tools - Direct access to graph and vector databases
 */
import { z } from "zod";
import type { FastMCP } from "fastmcp";
import { driver } from "../db/memgraph.js";
import { chroma } from "../db/chroma.js";

/**
 * Register all database access tools with the FastMCP server
 */
export function registerDatabaseTools(server: FastMCP) {
  /**
   * Execute a Cypher query against the Memgraph graph database.
   */
  server.addTool({
    name: "graph_query",
    description: "Execute a Cypher query against Memgraph and return rows",
    parameters: z.object({
      cypher: z.string(),
      params: z.record(z.string(), z.any()).default({})
    }),
    execute: async ({ cypher, params }) => {
      const session = driver.session();
      try {
        const res = await session.run(cypher, params);
        return JSON.stringify(res.records.map(r => r.toObject()), null, 2);
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Query a ChromaDB collection using semantic search.
   */
  server.addTool({
    name: "chroma_query",
    description: "Query a Chroma collection with a text query",
    parameters: z.object({
      collection: z.string(),
      queryTexts: z.array(z.string()).min(1),
      nResults: z.number().int().default(5)
    }),
    execute: async ({ collection, queryTexts, nResults }) => {
      const col = await chroma.getOrCreateCollection({ name: collection });
      const res = await col.query({ queryTexts, nResults });
      return JSON.stringify(res, null, 2);
    }
  });

  /**
   * Add documents to a ChromaDB collection.
   */
  server.addTool({
    name: "chroma_add",
    description: "Add documents to a Chroma collection",
    parameters: z.object({
      collection: z.string(),
      documents: z.array(z.string()),
      metadatas: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))).optional(),
      ids: z.array(z.string()).optional()
    }),
    execute: async ({ collection, documents, metadatas, ids }) => {
      const col = await chroma.getOrCreateCollection({ name: collection });
      const generatedIds = ids ?? documents.map((_, i) => `doc_${Date.now()}_${i}`);
      await col.add({ documents, metadatas: metadatas as any, ids: generatedIds });
      return `Added ${documents.length} documents to collection '${collection}'`;
    }
  });

  /**
   * Simple addition tool for testing and demonstration.
   */
  server.addTool({
    name: "add",
    description: "Add two numbers",
    parameters: z.object({
      a: z.number(),
      b: z.number(),
    }),
    execute: async (args) => {
      return String(args.a + args.b);
    },
  });
}
