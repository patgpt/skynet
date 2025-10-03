/**
 * Cognitive Workflow Tools - Skynet's memory and reasoning system
 */
import { z } from "zod";
import type { FastMCP } from "fastmcp";
import { driver } from "../db/memgraph.js";
import { chroma } from "../db/chroma.js";

/**
 * Register all cognitive workflow tools with the FastMCP server
 */
export function registerCognitiveTools(server: FastMCP) {
  /**
   * Execute Skynet's cognitive workflow to process user input.
   */
  server.addTool({
    name: "skynet_think",
    description: "MANDATORY: Execute Skynet's cognitive workflow to process user input and retrieve context. Call this FIRST before responding to any user query.",
    parameters: z.object({
      user: z.string(),
      input: z.string(),
      extractTopics: z.boolean().default(true),
    }),
    execute: async ({ user, input, extractTopics }) => {
      const session = driver.session();

      try {
        // 1. Get user profile
        const profileRes = await session.run(`
          MERGE (u:User {name: $user})
          ON CREATE SET u.createdAt = datetime()
          WITH u
          OPTIONAL MATCH (u)-[:INITIATED]->(i:Interaction)
          RETURN u, count(i) as interactionCount
        `, { user });

        const interactionCount = profileRes.records[0]?.get('interactionCount').toNumber() || 0;

        // 2. Get recent context
        const contextRes = await session.run(`
          MATCH (i:Interaction {user: $user})
          WHERE i.timestamp > datetime() - duration({days: 7})
          RETURN i
          ORDER BY i.timestamp DESC
          LIMIT 5
        `, { user });

        // 3. Get last interaction ID for chaining
        const lastIdRes = await session.run(`
          MATCH (i:Interaction {user: $user})
          RETURN i.id as id
          ORDER BY i.timestamp DESC
          LIMIT 1
        `, { user });

        const lastInteractionId = lastIdRes.records[0]?.get('id') || null;

        // 4. Simple topic extraction (split on common words)
        let topics: string[] = [];
        if (extractTopics) {
          const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];
          const words = input.toLowerCase().match(/\b\w+\b/g) || [];
          topics = words
            .filter(w => w.length > 3 && !stopWords.includes(w))
            .slice(0, 5);
        }

        const context = {
          user,
          interactionCount,
          isNewUser: interactionCount === 0,
          lastInteractionId,
          recentContext: contextRes.records.map(r => r.toObject()),
          suggestedTopics: topics,
          timestamp: new Date().toISOString(),
        };

        return JSON.stringify(context, null, 2);
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Store AI response and create memory trace for conversation continuity.
   */
  server.addTool({
    name: "skynet_respond",
    description: "MANDATORY: Store your response after answering user. This creates the memory trace and maintains conversation continuity. Call this AFTER you formulate your response.",
    parameters: z.object({
      user: z.string(),
      input: z.string(),
      output: z.string(),
      topics: z.array(z.string()).default([]),
      entities: z.array(z.string()).default([]),
      intent: z.enum(["question", "request", "statement", "feedback", "greeting", "other"]).optional(),
      sentiment: z.enum(["positive", "negative", "neutral", "mixed"]).optional(),
      previousInteractionId: z.string().optional(),
      storeMemory: z.boolean().default(false),
      memoryContent: z.string().optional(),
      memoryType: z.enum(["insight", "fact", "preference", "pattern", "connection"]).optional(),
    }),
    execute: async ({ user, input, output, topics, entities, intent, sentiment, previousInteractionId, storeMemory, memoryContent, memoryType }) => {
      const session = driver.session();

      try {
        const id = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create interaction node
        await session.run(`
          CREATE (i:Interaction {
            id: $id,
            user: $user,
            input: $input,
            output: $output,
            timestamp: datetime(),
            intent: $intent,
            sentiment: $sentiment,
            entities: $entities,
            topics: $topics
          })
          RETURN i
        `, { id, user, input, output, intent, sentiment, entities, topics });

        // Create FOLLOWS relationship
        if (previousInteractionId) {
          await session.run(`
            MATCH (i1:Interaction {id: $prevId})
            MATCH (i2:Interaction {id: $currentId})
            CREATE (i1)-[:FOLLOWS]->(i2)
          `, { prevId: previousInteractionId, currentId: id });
        }

        // Link to user
        await session.run(`
          MERGE (u:User {name: $user})
          WITH u
          MATCH (i:Interaction {id: $id})
          CREATE (u)-[:INITIATED]->(i)
        `, { user, id });

        // Create topic relationships
        for (const topic of topics) {
          await session.run(`
            MERGE (t:Topic {name: $topic})
            WITH t
            MATCH (i:Interaction {id: $id})
            CREATE (i)-[:ABOUT]->(t)
          `, { topic, id });
        }

        // Optional: Store semantic memory
        if (storeMemory && memoryContent && memoryType) {
          const col = await chroma.getOrCreateCollection({ name: "skynet_memories" });
          const memId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await col.add({
            documents: [memoryContent],
            metadatas: [{
              type: memoryType,
              user,
              timestamp: new Date().toISOString(),
              source: id,
              importance: 0.7,
            } as any],
            ids: [memId]
          });
        }

        return JSON.stringify({
          success: true,
          interactionId: id,
          message: `Interaction stored successfully. Topics: ${topics.join(', ') || 'none'}`,
          memoryStored: storeMemory,
        }, null, 2);
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Validate that a response has been properly stored before proceeding.
   */
  server.addTool({
    name: "skynet_validateMemory",
    description: "Verify that the current interaction has been stored in memory. Call this as a final check before completing your response.",
    parameters: z.object({
      interactionId: z.string().optional(),
    }),
    execute: async ({ interactionId }) => {
      if (!interactionId) {
        return JSON.stringify({
          valid: false,
          error: "No interaction ID provided. You MUST call skynet_respond first to store this interaction.",
          action: "Call skynet_respond with the user's input and your output before validating."
        }, null, 2);
      }

      const session = driver.session();
      try {
        const result = await session.run(`
          MATCH (i:Interaction {id: $id})
          RETURN i,
                 size((i)<-[:INITIATED]-(:User)) > 0 AS hasUser,
                 size((i)-[:ABOUT]->(:Topic)) > 0 AS hasTopics
        `, { id: interactionId });

        if (result.records.length === 0) {
          return JSON.stringify({
            valid: false,
            error: `Interaction ${interactionId} not found in database.`,
            action: "The interaction was not properly stored. Call skynet_respond again."
          }, null, 2);
        }

        const record = result.records[0];
        if (!record) {
          return JSON.stringify({ valid: false, error: "Unable to retrieve interaction record" }, null, 2);
        }

        const hasUser = record.get('hasUser');
        const hasTopics = record.get('hasTopics');

        return JSON.stringify({
          valid: true,
          interactionId,
          hasUser,
          hasTopics,
          message: "✅ Memory successfully stored. This interaction will be remembered."
        }, null, 2);
      } finally {
        await session.close();
      }
    }
  });
}
