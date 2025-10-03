# Database Tools

Direct access tools for querying Memgraph (graph database) and ChromaDB (vector database).

## graph_query

Execute a Cypher query against Memgraph and return rows.

**Parameters:**
- `cypher` (string, required): Cypher query to execute
- `params` (object, optional): Query parameters for safe parameterization. Default: `{}`

**Returns:**
```typescript
{
  rows: Record<string, any>[],
  summary: {
    counters: {
      nodesCreated: number,
      relationshipsCreated: number,
      propertiesSet: number,
      // ... other Neo4j result counters
    }
  }
}
```

**Example:**
```typescript
// Find user's recent interactions
const result = await graphQuery({
  cypher: "MATCH (u:User {name: $userName})-[:HAD]->(i:Interaction) RETURN i ORDER BY i.timestamp DESC LIMIT 10",
  params: { userName: "alice" }
});

// Create a relationship
await graphQuery({
  cypher: "MATCH (i1:Interaction {id: $id1}), (i2:Interaction {id: $id2}) CREATE (i1)-[:RELATED_TO {reason: $reason}]->(i2)",
  params: { id1: "inter_1", id2: "inter_2", reason: "similar topic" }
});
```

**Use Cases:**
- Complex graph traversals
- Custom analytics queries
- Data migration scripts
- Advanced relationship analysis

**Best Practices:**
- Always use `params` for user input (prevents Cypher injection)
- Limit result size with `LIMIT` clause
- Use `EXPLAIN` or `PROFILE` to optimize slow queries
- Index frequently queried properties

---

## chroma_query

Query a ChromaDB collection with text queries for semantic search.

**Parameters:**
- `collection` (string, required): Name of the ChromaDB collection
- `queryTexts` (string[], required): Array of query strings (minimum 1)
- `nResults` (integer, optional): Number of results per query. Default: `5`

**Returns:**
```typescript
{
  results: {
    ids: string[][],           // Result IDs per query
    distances: number[][],     // Similarity scores per query
    metadatas: object[][],     // Metadata per result per query
    documents: string[][],     // Document content per result per query
    embeddings: number[][][] | null
  }
}
```

**Example:**
```typescript
// Semantic search for memories
const result = await chromaQuery({
  collection: "skynet_memories",
  queryTexts: ["How do I handle authentication?"],
  nResults: 5
});

// Access results
const topResult = {
  id: result.results.ids[0][0],
  content: result.results.documents[0][0],
  metadata: result.results.metadatas[0][0],
  distance: result.results.distances[0][0]  // Lower is more similar
};
```

**Use Cases:**
- Semantic memory retrieval
- Finding similar interactions
- Context-aware recommendations
- Duplicate detection

**Distance Interpretation:**
- ChromaDB uses cosine distance by default
- Range: 0.0 (identical) to 2.0 (opposite)
- Typical threshold: < 0.5 for "similar", < 0.2 for "very similar"

---

## chroma_add

Add documents to a ChromaDB collection with optional metadata.

**Parameters:**
- `collection` (string, required): Name of the ChromaDB collection
- `documents` (string[], required): Array of document content strings
- `ids` (string[], optional): Unique IDs for documents. Auto-generated if omitted.
- `metadatas` (object[], optional): Metadata objects for each document

**Returns:**
```typescript
{
  count: number,  // Number of documents added
  ids: string[]   // IDs of added documents (generated if not provided)
}
```

**Example:**
```typescript
// Store memory with metadata
await chromaAdd({
  collection: "skynet_memories",
  documents: ["User prefers dark mode UI"],
  ids: ["mem_12345"],
  metadatas: [{
    type: "preference",
    user: "alice",
    importance: 0.8,
    timestamp: Date.now()
  }]
});

// Bulk add without IDs (auto-generated)
await chromaAdd({
  collection: "skynet_memories",
  documents: [
    "Insight: User asks about auth on Mondays",
    "Fact: User timezone is EST"
  ]
});
```

**Use Cases:**
- Store semantic memories
- Index conversation history
- Cache embedding-based data
- Build searchable knowledge base

**Best Practices:**
- Include rich metadata for filtering
- Use consistent ID format (e.g., `mem_`, `inter_`)
- Batch documents for efficiency (up to 1000/call)
- Keep documents focused (1-2 paragraphs max)

---

## add

Add two numbers together.

**Parameters:**
- `a` (number, required): First number
- `b` (number, required): Second number

**Returns:**
```typescript
number  // Sum of a + b
```

**Example:**
```typescript
const sum = await add({ a: 5, b: 3 }); // Returns 8
```

**Note:** This is a simple utility tool, primarily used for testing and demonstration purposes.

---

## Technical Details

### Memgraph Connection

- **Protocol**: Bolt (Neo4j-compatible)
- **Default URL**: `bolt://localhost:7687`
- **Driver**: `neo4j-driver` npm package
- **Authentication**: Optional (configure via env vars)
- **Session management**: Auto-cleanup after queries

### ChromaDB Connection

- **Protocol**: HTTP REST API
- **Default URL**: `http://localhost:8000`
- **Client**: `chromadb` npm package
- **Embedding**: Server-side (no local embedding required)
- **Collections**: Auto-created on first add

### Error Handling

Common error scenarios:

- **Connection refused**: Database not running (use `stack_up`)
- **Collection not found**: Created automatically on `chroma_add`
- **Invalid Cypher syntax**: Returns descriptive error message
- **Parameter mismatch**: Cypher params must match placeholders

### Performance Considerations

**Memgraph:**
- Index properties used in `WHERE` clauses
- Use `LIMIT` to avoid large result sets
- Batch writes in transactions for bulk operations

**ChromaDB:**
- Embedding generation can be slow for large documents
- Query multiple texts at once (batching)
- Collections are in-memory (limited by RAM)

### See Also

- [Memory Tools](/api/memory) - Higher-level semantic memory operations
- [Interaction Tools](/api/interactions) - User interaction tracking
- [Infrastructure Tools](/api/infrastructure) - Container management
