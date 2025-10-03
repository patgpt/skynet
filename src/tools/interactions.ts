/**
 * Interaction Tools - Graph-based interaction tracking and analysis
 */
import { z } from "zod";
import type { FastMCP } from "fastmcp";
import { driver, executeQuery } from "../db/memgraph.js";

/**
 * Register all interaction management tools with the FastMCP server
 */
export function registerInteractionTools(server: FastMCP) {
  /**
   * Store a user interaction in the graph database with full context.
   */
  server.addTool({
    name: "interaction_store",
    description: "Store an interaction in the graph database with entities, topics, and relationships",
    parameters: z.object({
      user: z.string(),
      input: z.string(),
      output: z.string(),
      intent: z.string().optional(),
      sentiment: z.enum(["positive", "negative", "neutral", "mixed"]).optional(),
      entities: z.array(z.string()).default([]),
      topics: z.array(z.string()).default([]),
      previousInteractionId: z.string().optional(),
    }),
    execute: async ({ user, input, output, intent, sentiment, entities, topics, previousInteractionId }) => {
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

        // Create FOLLOWS relationship if there's a previous interaction
        if (previousInteractionId) {
          await session.run(`
            MATCH (i1:Interaction {id: $prevId})
            MATCH (i2:Interaction {id: $currentId})
            CREATE (i1)-[:FOLLOWS]->(i2)
          `, { prevId: previousInteractionId, currentId: id });
        }

        // Create or merge user node and relationship
        await session.run(`
          MERGE (u:User {name: $user})
          WITH u
          MATCH (i:Interaction {id: $id})
          CREATE (u)-[:INITIATED]->(i)
        `, { user, id });

        // Create topic nodes and relationships
        for (const topic of topics) {
          await session.run(`
            MERGE (t:Topic {name: $topic})
            WITH t
            MATCH (i:Interaction {id: $id})
            CREATE (i)-[:ABOUT]->(t)
          `, { topic, id });
        }

        return `Stored interaction with ID: ${id}\nUser: ${user}\nTopics: ${topics.join(", ")}`;
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Retrieve recent interaction history for a user.
   */
  server.addTool({
    name: "interaction_getContext",
    description: "Retrieve recent interaction history for a user with optional filtering by topics/entities",
    parameters: z.object({
      user: z.string(),
      limit: z.number().int().default(10),
      days: z.number().int().default(7),
      topics: z.array(z.string()).optional(),
    }),
    execute: async ({ user, limit, days, topics }) => {
      const session = driver.session();
      try {
        const query = topics && topics.length > 0 ? `
          MATCH (i:Interaction {user: $user})
          WHERE i.timestamp > datetime() - duration({days: $days})
          AND any(topic IN i.topics WHERE topic IN $topics)
          RETURN i
          ORDER BY i.timestamp DESC
          LIMIT $limit
        ` : `
          MATCH (i:Interaction {user: $user})
          WHERE i.timestamp > datetime() - duration({days: $days})
          RETURN i
          ORDER BY i.timestamp DESC
          LIMIT $limit
        `;

        const res = await session.run(query, { user, days, limit, topics });
        return JSON.stringify(res.records.map(r => r.toObject()), null, 2);
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Find interactions related to specific topics or entities via graph traversal.
   */
  server.addTool({
    name: "interaction_findRelated",
    description: "Find interactions related to current topics or entities using graph traversal",
    parameters: z.object({
      topics: z.array(z.string()).optional(),
      entities: z.array(z.string()).optional(),
      user: z.string().optional(),
      limit: z.number().int().default(5),
    }),
    execute: async ({ topics, entities, user, limit }) => {
      const session = driver.session();
      try {
        let query = `MATCH (i:Interaction)`;
        const conditions = [];

        if (topics && topics.length > 0) {
          query += `\nMATCH (i)-[:ABOUT]->(t:Topic)`;
          conditions.push(`t.name IN $topics`);
        }

        if (user) {
          conditions.push(`i.user = $user`);
        }

        if (entities && entities.length > 0) {
          conditions.push(`any(entity IN i.entities WHERE entity IN $entities)`);
        }

        if (conditions.length > 0) {
          query += `\nWHERE ` + conditions.join(' AND ');
        }

        query += `\nRETURN DISTINCT i ORDER BY i.timestamp DESC LIMIT $limit`;

        const res = await session.run(query, { topics, entities, user, limit });
        return JSON.stringify(res.records.map(r => r.toObject()), null, 2);
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Retrieve or create a comprehensive user profile.
   */
  server.addTool({
    name: "user_getProfile",
    description: "Retrieve or create a user profile with preferences and interaction patterns",
    parameters: z.object({
      user: z.string(),
    }),
    execute: async ({ user }) => {
      const session = driver.session();
      try {
        // Get user node and interaction count
        const userRes = await session.run(`
          MATCH (u:User {name: $user})
          OPTIONAL MATCH (u)-[:INITIATED]->(i:Interaction)
          RETURN u, count(i) as interactionCount
        `, { user });

        if (userRes.records.length === 0) {
          // Create new user
          await session.run(`CREATE (u:User {name: $user, createdAt: datetime()})`, { user });
          return JSON.stringify({ user, interactionCount: 0, isNew: true });
        }

        // Get user's favorite topics
        const topicsRes = await session.run(`
          MATCH (u:User {name: $user})-[:INITIATED]->(i:Interaction)-[:ABOUT]->(t:Topic)
          RETURN t.name as topic, count(*) as frequency
          ORDER BY frequency DESC
          LIMIT 10
        `, { user });

        const profile = {
          user,
          interactionCount: userRes.records[0]?.get('interactionCount').toNumber() || 0,
          favoriteTopics: topicsRes.records.map(r => ({
            topic: r.get('topic'),
            frequency: r.get('frequency').toNumber()
          })),
        };

        return JSON.stringify(profile, null, 2);
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Create a custom relationship between two interactions in the graph.
   */
  server.addTool({
    name: "graph_createRelationship",
    description: "Create a custom relationship between two interactions or entities",
    parameters: z.object({
      fromId: z.string(),
      toId: z.string(),
      relationshipType: z.enum(["RELATED_TO", "CONTRADICTS", "BUILDS_ON", "REFERENCES", "SIMILAR_TO"]),
      properties: z.object({
        similarity: z.number().optional(),
        reason: z.string().optional(),
      }).optional(),
    }),
    execute: async ({ fromId, toId, relationshipType, properties }) => {
      const session = driver.session();
      try {
        await session.run(`
          MATCH (a:Interaction {id: $fromId})
          MATCH (b:Interaction {id: $toId})
          CREATE (a)-[r:${relationshipType} $props]->(b)
          RETURN r
        `, { fromId, toId, props: properties || {} });

        return `Created ${relationshipType} relationship from ${fromId} to ${toId}`;
      } finally {
        await session.close();
      }
    }
  });

  /**
   * Analyze interaction patterns and extract meta-insights.
   */
  server.addTool({
    name: "analytics_getInsights",
    description: "Analyze interaction patterns and extract meta-insights about conversations",
    parameters: z.object({
      user: z.string().optional(),
      days: z.number().int().default(30),
    }),
    execute: async ({ user, days }) => {
      const session = driver.session();
      try {
        const userFilter = user ? `{user: $user}` : ``;

        // Get conversation patterns
        const patternsRes = await session.run(`
          MATCH (i:Interaction ${userFilter})
          WHERE i.timestamp > datetime() - duration({days: $days})
          RETURN 
            count(i) as totalInteractions,
            collect(DISTINCT i.intent) as intents,
            collect(DISTINCT i.sentiment) as sentiments,
            size(collect(DISTINCT i.topics)) as uniqueTopics
        `, { user, days });

        // Get topic trends
        const topicsRes = await session.run(`
          MATCH (i:Interaction ${userFilter})-[:ABOUT]->(t:Topic)
          WHERE i.timestamp > datetime() - duration({days: $days})
          RETURN t.name as topic, count(*) as mentions
          ORDER BY mentions DESC
          LIMIT 10
        `, { user, days });

        const insights = {
          period: `Last ${days} days`,
          user: user || "all users",
          summary: patternsRes.records[0]?.toObject(),
          trendingTopics: topicsRes.records.map(r => r.toObject()),
        };

        return JSON.stringify(insights, null, 2);
      } finally {
        await session.close();
      }
    }
  });
}
