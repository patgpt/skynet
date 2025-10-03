# Memory Tools

High-level tools for storing and searching semantic memories with rich metadata.

## memory_store

Store a semantic memory or insight in the vector database with structured metadata.

**Parameters:**
- `content` (string, required): The memory content to store
- `metadata` (object, required): Structured metadata object
  - `type` (enum, required): Memory category - `"insight"`, `"fact"`, `"preference"`, `"pattern"`, or `"connection"`
  - `user` (string, optional): Associated user identifier
  - `importance` (number, optional): Importance score 0.0-1.0. Default: `0.5`
  - `confidence` (number, optional): Confidence score 0.0-1.0. Default: `0.8`
  - `emotion` (enum, optional): Emotional context - `"curiosity"`, `"satisfaction"`, `"concern"`, `"neutral"`, or `"excitement"`
  - `tags` (string[], optional): Searchable tags. Default: `[]`
- `collection` (string, optional): ChromaDB collection name. Default: `"skynet_memories"`

**Returns:**
```typescript
{
  id: string,           // Auto-generated memory ID (mem_TIMESTAMP)
  collection: string,   // Collection where memory was stored
  content: string,      // Stored content
  metadata: object      // Full metadata including timestamp
}
```

**Example:**
```typescript
// Store a user preference
await memoryStore({
  content: "User prefers concise responses without verbose explanations",
  metadata: {
    type: "preference",
    user: "alice",
    importance: 0.9,
    confidence: 0.95,
    tags: ["communication", "style"]
  }
});

// Store an insight with emotion
await memoryStore({
  content: "User tends to ask about authentication on Monday mornings",
  metadata: {
    type: "pattern",
    user: "alice",
    importance: 0.7,
    emotion: "curiosity",
    tags: ["temporal", "authentication"]
  }
});

// Store a fact
await memoryStore({
  content: "User's production environment uses PostgreSQL 14",
  metadata: {
    type: "fact",
    user: "alice",
    importance: 0.8,
    confidence: 1.0,
    tags: ["infrastructure", "database"]
  }
});
```

**Memory Types:**

| Type | Description | Use Cases |
|------|-------------|-----------|
| `insight` | Derived understanding or pattern | Behavioral patterns, learning insights |
| `fact` | Concrete, verifiable information | Technical specs, user details |
| `preference` | User choices or settings | UI preferences, communication style |
| `pattern` | Recurring behavior or trend | Usage patterns, temporal trends |
| `connection` | Relationship between concepts | Cross-topic links, associations |

**Importance Scoring:**

- **0.0-0.3**: Low importance (ephemeral context)
- **0.4-0.6**: Medium importance (useful context)
- **0.7-0.9**: High importance (key preferences/facts)
- **0.9-1.0**: Critical importance (core identity/requirements)

**Use Cases:**
- Long-term preference tracking
- Learning from user interactions
- Building contextual understanding
- Personalization data

---

## memory_search

Search semantic memories across collections for relevant context.

**Parameters:**
- `query` (string, required): Natural language search query
- `collection` (string, optional): Collection to search. Default: `"skynet_memories"`
- `nResults` (integer, optional): Maximum results to return. Default: `5`
- `filter` (object, optional): Metadata filters
  - `type` (enum, optional): Filter by memory type
  - `user` (string, optional): Filter by user
  - `minImportance` (number, optional): Minimum importance threshold

**Returns:**
```typescript
{
  results: Array<{
    id: string,
    content: string,
    metadata: {
      type: string,
      user?: string,
      importance: number,
      confidence: number,
      emotion?: string,
      tags: string[],
      timestamp: number
    },
    distance: number  // Similarity score (lower = more similar)
  }>,
  query: string,
  count: number
}
```

**Example:**
```typescript
// Search all memories
const memories = await memorySearch({
  query: "user preferences for API responses",
  nResults: 3
});

// Search with filters
const importantFacts = await memorySearch({
  query: "database configuration",
  filter: {
    type: "fact",
    user: "alice",
    minImportance: 0.7
  },
  nResults: 5
});

// Search by emotion
const concernMemories = await memorySearch({
  query: "performance issues",
  filter: {
    emotion: "concern"
  }
});
```

**Filtering Examples:**

```typescript
// User-specific preferences
filter: { type: "preference", user: "alice" }

// High-confidence facts
filter: { type: "fact", minImportance: 0.8 }

// Recent patterns (combine with timestamp sorting)
filter: { type: "pattern", user: "alice" }
```

**Distance Interpretation:**

- **< 0.2**: Highly relevant (exact match)
- **0.2-0.5**: Relevant (strong semantic similarity)
- **0.5-0.8**: Somewhat relevant (weak similarity)
- **> 0.8**: Likely not relevant

**Use Cases:**
- Retrieve relevant context for conversations
- Find similar past interactions
- Personalize responses based on preferences
- Context-aware recommendations

---

## Technical Details

### Storage Strategy

**Automatic Features:**
- **ID Generation**: `mem_TIMESTAMP` format for uniqueness
- **Timestamp**: Added to metadata automatically
- **Embeddings**: Generated server-side by ChromaDB
- **Deduplication**: Based on ID (re-adding same ID updates)

**Metadata Schema:**
```typescript
interface MemoryMetadata {
  type: "insight" | "fact" | "preference" | "pattern" | "connection";
  user?: string;
  importance: number;      // 0.0-1.0
  confidence: number;      // 0.0-1.0
  emotion?: "curiosity" | "satisfaction" | "concern" | "neutral" | "excitement";
  tags: string[];
  timestamp: number;       // Unix timestamp (milliseconds)
}
```

### Search Algorithm

1. **Embedding Generation**: Query text → vector embedding
2. **Similarity Search**: Cosine similarity against stored embeddings
3. **Metadata Filtering**: Post-filter results by metadata criteria
4. **Ranking**: Sort by distance (ascending)
5. **Limit**: Return top N results

### Best Practices

**Storage:**
- Be specific and concise (1-3 sentences)
- Use appropriate memory types
- Tag comprehensively for better retrieval
- Set importance based on longevity needs
- Include user context when relevant

**Search:**
- Use natural language queries
- Filter by type to narrow results
- Combine with importance threshold for quality
- Review distance scores before using results
- Handle empty results gracefully

**Maintenance:**
- Periodically clean low-importance memories
- Update confidence scores as information changes
- Merge duplicate or contradictory memories
- Archive old memories vs deletion

### Performance

**ChromaDB Characteristics:**
- In-memory operation (fast but RAM-limited)
- Embedding generation is the bottleneck (~100ms per document)
- Batch operations are more efficient
- Collections are lazy-loaded

**Optimization Tips:**
- Batch store operations when possible
- Use specific filters to reduce result set
- Keep documents concise for faster embedding
- Monitor collection size (10k+ may slow)

### Integration with Other Tools

Memory tools work seamlessly with:
- **Interaction Tools**: Auto-store insights from interactions
- **Cognitive Tools**: `skynet_think` searches memories for context
- **Analytics Tools**: Derive patterns from memory trends

### See Also

- [Interaction Tools](/api/interactions) - User interaction tracking
- [Cognitive Tools](/api/cognitive) - Skynet workflow integration
- [Database Tools](/api/database) - Low-level ChromaDB access
