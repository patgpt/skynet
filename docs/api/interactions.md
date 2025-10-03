# Interaction Tools

Tools for tracking user interactions, building user profiles, and analyzing conversation patterns in the graph database.

## interaction_store

Store an interaction in the graph database with entities, topics, and relationships to build a conversation graph.

**Parameters:**
- `user` (string, required): User identifier
- `input` (string, required): User's input/query
- `output` (string, required): System's response
- `intent` (string, optional): Categorized intent (e.g., "question", "request")
- `sentiment` (enum, optional): Detected sentiment - `"positive"`, `"negative"`, `"neutral"`, or `"mixed"`
- `topics` (string[], optional): Conversation topics. Default: `[]`
- `entities` (string[], optional): Named entities mentioned. Default: `[]`
- `previousInteractionId` (string, optional): ID of previous interaction to link continuity

**Returns:**
```typescript
{
  interactionId: string,      // Generated ID (inter_TIMESTAMP)
  user: string,
  timestamp: number,
  topicCount: number,         // Number of topics linked
  entityCount: number,        // Number of entities linked
  linkedToPrevious: boolean   // Whether continuity was established
}
```

**Example:**
```typescript
// Basic interaction storage
const result = await interactionStore({
  user: "alice",
  input: "How do I set up authentication?",
  output: "Here's how to set up authentication...",
  intent: "question",
  sentiment: "neutral",
  topics: ["authentication", "security"],
  entities: ["OAuth", "JWT"]
});

// Linked conversation
await interactionStore({
  user: "alice",
  input: "Can you explain JWT more?",
  output: "JWT stands for JSON Web Token...",
  intent: "follow_up",
  sentiment: "curious",
  topics: ["authentication", "JWT"],
  entities: ["JWT", "JSON"],
  previousInteractionId: result.interactionId
});
```

**Graph Structure Created:**

```
(User {name: "alice"})
  -[:HAD]-> (Interaction {
              id: "inter_123",
              timestamp: 1234567890,
              input: "...",
              output: "...",
              intent: "question",
              sentiment: "neutral"
            })
              -[:ABOUT]-> (Topic {name: "authentication"})
              -[:ABOUT]-> (Topic {name: "security"})
              -[:MENTIONS]-> (Entity {name: "OAuth"})
              -[:MENTIONS]-> (Entity {name: "JWT"})
              -[:FOLLOWS]-> (PreviousInteraction)
```

**Use Cases:**
- Conversation history tracking
- Context continuity across sessions
- Topic trend analysis
- Entity relationship mapping

---

## interaction_getContext

Retrieve recent interaction history for a user with optional filtering by topics/entities.

**Parameters:**
- `user` (string, required): User identifier
- `days` (integer, optional): Number of days to look back. Default: `7`
- `limit` (integer, optional): Maximum interactions to return. Default: `10`
- `topics` (string[], optional): Filter by specific topics

**Returns:**
```typescript
{
  user: string,
  interactions: Array<{
    id: string,
    timestamp: number,
    input: string,
    output: string,
    intent?: string,
    sentiment?: string,
    topics: string[],
    entities: string[]
  }>,
  count: number,
  timeRange: {
    start: number,
    end: number,
    days: number
  }
}
```

**Example:**
```typescript
// Get recent interactions
const context = await interactionGetContext({
  user: "alice",
  days: 7,
  limit: 10
});

// Filter by topic
const authContext = await interactionGetContext({
  user: "alice",
  topics: ["authentication", "security"],
  days: 30
});

// Use in conversation
console.log(`Found ${context.count} interactions in the last ${context.timeRange.days} days`);
context.interactions.forEach(i => {
  console.log(`[${new Date(i.timestamp)}] ${i.input}`);
});
```

**Use Cases:**
- Pre-conversation context loading
- Debugging user issues
- Personalized greetings ("Last time we talked about...")
- Session resumption

---

## interaction_findRelated

Find interactions related to current topics or entities using graph traversal.

**Parameters:**
- `user` (string, optional): Filter by specific user
- `topics` (string[], optional): Topics to find related interactions
- `entities` (string[], optional): Entities to find related interactions
- `limit` (integer, optional): Maximum results. Default: `5`

**Returns:**
```typescript
{
  interactions: Array<{
    id: string,
    user: string,
    timestamp: number,
    input: string,
    output: string,
    relevance: {
      topicMatches: string[],
      entityMatches: string[],
      score: number  // Combined relevance score
    }
  }>,
  query: {
    topics: string[],
    entities: string[],
    user?: string
  },
  count: number
}
```

**Example:**
```typescript
// Find related by topics
const related = await interactionFindRelated({
  topics: ["authentication", "JWT"],
  limit: 5
});

// Find by entities
const entityRelated = await interactionFindRelated({
  entities: ["PostgreSQL", "Redis"],
  user: "alice"
});

// Multi-criteria
const combined = await interactionFindRelated({
  topics: ["performance"],
  entities: ["database"],
  limit: 3
});
```

**Relevance Scoring:**
- Topic match: +1.0 per matching topic
- Entity match: +0.5 per matching entity
- Recent interactions: +0.1 per day recency
- Same user: +0.5 bonus

**Use Cases:**
- "You previously asked about this..."
- Finding contradictions in past conversations
- Building comprehensive topic knowledge
- Cross-user pattern detection

---

## user_getProfile

Retrieve or create a user profile with preferences and interaction patterns.

**Parameters:**
- `user` (string, required): User identifier

**Returns:**
```typescript
{
  user: string,
  profile: {
    created: number,         // First interaction timestamp
    lastSeen: number,        // Most recent interaction timestamp
    totalInteractions: number,
    topTopics: Array<{
      topic: string,
      count: number
    }>,
    topEntities: Array<{
      entity: string,
      count: number
    }>,
    sentimentBreakdown: {
      positive: number,
      negative: number,
      neutral: number,
      mixed: number
    }
  },
  exists: boolean  // Whether profile existed before this call
}
```

**Example:**
```typescript
const profile = await userGetProfile({ user: "alice" });

console.log(`User ${profile.user} has ${profile.profile.totalInteractions} interactions`);
console.log(`Top topics:`, profile.profile.topTopics);
console.log(`Overall sentiment:`, profile.profile.sentimentBreakdown);
console.log(`Active since:`, new Date(profile.profile.created));
```

**Profile Creation:**
- If user doesn't exist, creates minimal profile node
- Aggregates stats from interaction history
- Updates dynamically on each call (not cached)

**Use Cases:**
- User onboarding vs returning user detection
- Personalized conversation starters
- Analytics dashboards
- Behavior trend analysis

---

## graph_createRelationship

Create a custom relationship between two interactions or entities.

**Parameters:**
- `fromId` (string, required): Source node ID (interaction, topic, or entity)
- `toId` (string, required): Target node ID (interaction, topic, or entity)
- `relationshipType` (enum, required): Type of relationship
  - `"RELATED_TO"` - General association
  - `"CONTRADICTS"` - Conflicting information
  - `"BUILDS_ON"` - Extends or develops previous idea
  - `"REFERENCES"` - Explicit reference/citation
  - `"SIMILAR_TO"` - Semantic similarity
- `properties` (object, optional): Additional relationship metadata
  - `reason` (string, optional): Explanation for relationship
  - `similarity` (number, optional): Similarity score 0.0-1.0

**Returns:**
```typescript
{
  from: string,
  to: string,
  type: string,
  properties: object,
  created: boolean  // Whether relationship was newly created
}
```

**Example:**
```typescript
// Link related interactions
await graphCreateRelationship({
  fromId: "inter_123",
  toId: "inter_456",
  relationshipType: "BUILDS_ON",
  properties: {
    reason: "Follow-up question on same topic",
    similarity: 0.85
  }
});

// Mark contradiction
await graphCreateRelationship({
  fromId: "inter_789",
  toId: "inter_123",
  relationshipType: "CONTRADICTS",
  properties: {
    reason: "User changed preference from dark to light mode"
  }
});

// Create reference
await graphCreateRelationship({
  fromId: "inter_999",
  toId: "inter_123",
  relationshipType: "REFERENCES",
  properties: {
    reason: "User asked to recall previous conversation"
  }
});
```

**Relationship Types:**

| Type | Description | Use Cases |
|------|-------------|-----------|
| `RELATED_TO` | General association | Grouping similar conversations |
| `CONTRADICTS` | Conflicting information | Preference changes, corrections |
| `BUILDS_ON` | Extends previous idea | Follow-up questions, iterations |
| `REFERENCES` | Explicit citation | "As we discussed before..." |
| `SIMILAR_TO` | Semantic similarity | Detecting patterns, duplicates |

**Use Cases:**
- Building knowledge graphs
- Detecting contradictions
- Conversation threading
- Learning relationship patterns

---

## analytics_getInsights

Analyze interaction patterns and extract meta-insights about conversations.

**Parameters:**
- `user` (string, optional): Analyze specific user (omit for all users)
- `days` (integer, optional): Time window for analysis. Default: `30`

**Returns:**
```typescript
{
  timeRange: {
    start: number,
    end: number,
    days: number
  },
  user?: string,
  insights: {
    totalInteractions: number,
    activeUsers: number,  // If user not specified
    topTopics: Array<{
      topic: string,
      count: number,
      trend: "rising" | "stable" | "falling"
    }>,
    topEntities: Array<{
      entity: string,
      count: number
    }>,
    sentimentTrend: Array<{
      date: string,
      positive: number,
      negative: number,
      neutral: number
    }>,
    conversationPatterns: {
      avgTopicsPerInteraction: number,
      avgEntitiesPerInteraction: number,
      mostCommonIntent: string,
      peakActivityHour?: number  // Hour of day (0-23)
    }
  }
}
```

**Example:**
```typescript
// User-specific insights
const userInsights = await analyticsGetInsights({
  user: "alice",
  days: 30
});

console.log(`Alice has ${userInsights.insights.totalInteractions} interactions`);
console.log(`Top topic: ${userInsights.insights.topTopics[0].topic} (${userInsights.insights.topTopics[0].trend})`);

// Platform-wide insights
const globalInsights = await analyticsGetInsights({
  days: 7
});

console.log(`${globalInsights.insights.activeUsers} active users this week`);
console.log(`Most discussed: ${globalInsights.insights.topTopics[0].topic}`);
```

**Trend Detection:**
- **Rising**: Topic count increasing week-over-week
- **Stable**: Topic count within 10% of previous period
- **Falling**: Topic count decreasing week-over-week

**Use Cases:**
- User behavior analysis
- Content recommendations
- Feature usage tracking
- Health monitoring (sentiment trends)

---

## Technical Details

### Graph Schema

**Nodes:**
```cypher
(:User {name: string})
(:Interaction {
  id: string,
  timestamp: number,
  input: string,
  output: string,
  intent: string,
  sentiment: string
})
(:Topic {name: string})
(:Entity {name: string})
```

**Relationships:**
```cypher
(User)-[:HAD]->(Interaction)
(Interaction)-[:ABOUT]->(Topic)
(Interaction)-[:MENTIONS]->(Entity)
(Interaction)-[:FOLLOWS]->(Interaction)
(Interaction)-[:RELATED_TO|CONTRADICTS|BUILDS_ON|REFERENCES|SIMILAR_TO]->(Interaction)
```

### Best Practices

**Storage:**
- Extract meaningful topics (3-5 per interaction)
- Normalize entity names (case-insensitive)
- Always link to previous interaction for continuity
- Use consistent user identifiers

**Retrieval:**
- Limit time ranges to avoid performance issues
- Use topic filters to narrow results
- Cache user profiles for active sessions
- Handle missing data gracefully

**Analysis:**
- Run analytics off-peak for large datasets
- Aggregate at application level when possible
- Use graph indexes on frequently queried properties
- Monitor query performance with `PROFILE`

### Performance

**Optimization:**
- Index: `CREATE INDEX ON :Interaction(timestamp)`
- Index: `CREATE INDEX ON :User(name)`
- Index: `CREATE INDEX ON :Topic(name)`
- Batch relationship creation for imports
- Use parameters in Cypher queries

### See Also

- [Memory Tools](/api/memory) - Semantic memory storage
- [Cognitive Tools](/api/cognitive) - Skynet workflow
- [Database Tools](/api/database) - Low-level graph access
