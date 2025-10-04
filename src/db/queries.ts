/**
 * @todo
 * @description
 * @see Documentation: https://docs.memgraph.com/memgraph/reference-guide/cypher/
 * @copyright Yellowdog Digital, 2025
 *
 *
 * Cypher queries for interacting with the Memgraph database.
 * These queries cover user profiles, interactions, topics, and insights.
 */

const RELATIONSHIP_TYPES = new Set([
	"RELATED_TO",
	"CONTRADICTS",
	"BUILDS_ON",
	"REFERENCES",
	"SIMILAR_TO",
]);

export const queries = {
	cognitive: {
		getProfile: `
      MERGE (u:User {name: $user})
      ON CREATE SET u.createdAt = datetime()
      WITH u
      OPTIONAL MATCH (u)-[:INITIATED]->(i:Interaction)
      RETURN u, count(i) as interactionCount
    `,
		getRecentContext: `
      MATCH (i:Interaction {user: $user})
      WHERE i.timestamp > datetime() - duration('P7D')
      RETURN i
      ORDER BY i.timestamp DESC
      LIMIT 5
    `,
		getLastInteractionId: `
      MATCH (i:Interaction {user: $user})
      RETURN i.id as id
      ORDER BY i.timestamp DESC
      LIMIT 1
    `,
		validateMemory: `
      MATCH (i:Interaction {id: $id})
      RETURN i,
             size((i)<-[:INITIATED]-(:User)) > 0 AS hasUser,
             size((i)-[:ABOUT]->(:Topic)) > 0 AS hasTopics
    `,
	},
	interactions: {
		createInteraction: `
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
    `,
		follows: `
      MATCH (i1:Interaction {id: $prevId})
      MATCH (i2:Interaction {id: $currentId})
      CREATE (i1)-[:FOLLOWS]->(i2)
    `,
		initiated: `
      MERGE (u:User {name: $user})
      WITH u
      MATCH (i:Interaction {id: $id})
      CREATE (u)-[:INITIATED]->(i)
    `,
		about: `
      MERGE (t:Topic {name: $topic})
      WITH t
      MATCH (i:Interaction {id: $id})
      CREATE (i)-[:ABOUT]->(t)
    `,
		getContextWithTopics: `
      MATCH (i:Interaction {user: $user})
      WHERE i.timestamp > datetime() - duration('P' + toString($days) + 'D')
      AND any(topic IN i.topics WHERE topic IN $topics)
      RETURN i
      ORDER BY i.timestamp DESC
      LIMIT $limit
    `,
		getContext: `
      MATCH (i:Interaction {user: $user})
      WHERE i.timestamp > datetime() - duration('P' + toString($days) + 'D')
      RETURN i
      ORDER BY i.timestamp DESC
      LIMIT $limit
    `,
		findRelated: `
        MATCH (i:Interaction)
        OPTIONAL MATCH (i)-[:ABOUT]->(t:Topic)
        WITH i, collect(DISTINCT t.name) AS topicNames
        WHERE
          ($user IS NULL OR i.user = $user)
          AND (size($topics) = 0 OR any(topic IN topicNames WHERE topic IN $topics))
          AND (size($entities) = 0 OR any(entity IN i.entities WHERE entity IN $entities))
        RETURN DISTINCT i
        ORDER BY i.timestamp DESC
        LIMIT $limit
      `,
		getUserProfile: `
      MATCH (u:User {name: $user})
      OPTIONAL MATCH (u)-[:INITIATED]->(i:Interaction)
      RETURN u, count(i) as interactionCount
    `,
		createUser: `CREATE (u:User {name: $user, createdAt: datetime()})`,
		favoriteTopics: `
      MATCH (u:User {name: $user})-[:INITIATED]->(i:Interaction)-[:ABOUT]->(t:Topic)
      RETURN t.name as topic, count(*) as frequency
      ORDER BY frequency DESC
      LIMIT 10
    `,
		createRelationship: (relationshipType: string) => {
			if (!RELATIONSHIP_TYPES.has(relationshipType)) {
				throw new Error(`Invalid relationship type: ${relationshipType}`);
			}
			return `
        MATCH (a:Interaction {id: $fromId})
        MATCH (b:Interaction {id: $toId})
        CREATE (a)-[r:${relationshipType} $props]->(b)
        RETURN r
      `;
		},
		getInsights: (userFilter: string) => `
      MATCH (i:Interaction ${userFilter})
      WHERE i.timestamp > datetime() - duration('P' + toString($days) + 'D')
      RETURN 
        count(i) as totalInteractions,
        collect(DISTINCT i.intent) as intents,
        collect(DISTINCT i.sentiment) as sentiments,
        size(collect(DISTINCT i.topics)) as uniqueTopics
    `,
		topicTrends: (userFilter: string) => `
      MATCH (i:Interaction ${userFilter})-[:ABOUT]->(t:Topic)
      WHERE i.timestamp > datetime() - duration('P' + toString($days) + 'D')
      RETURN t.name as topic, count(*) as mentions
      ORDER BY mentions DESC
      LIMIT 10
    `,
	},
};
