# Tools Overview

Skynet MCP Server provides 15 tools across 5 categories.

## Infrastructure Tools (3)

Manage Docker containers for Memgraph and ChromaDB.

### `stack_up`
Start or ensure Memgraph and Chroma Docker containers are running.

**Parameters:**
- `memgraphImage` (string, default: `"memgraph/memgraph:latest"`)
- `chromaImage` (string, default: `"chromadb/chroma:latest"`)
- `memgraphPort` (number, default: `7687`)
- `chromaPort` (number, default: `8000`)

**Returns:** Success message

### `stack_down`
Stop and remove the Memgraph and Chroma containers.

**Parameters:**
- `containers` (`"all"` or array of container keys)
- `force` (boolean, default: `false`)
- `confirm` (must be `true`) — acknowledgement for this destructive action

**Returns:** Success message

### `stack_status`
Get current running status and IDs of both containers.

**Parameters:**
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Container status in the requested format

---

## Database Tools (3)

Direct access to graph and vector databases.

### `graph_query`
Execute a Cypher query against Memgraph.

**Parameters:**
- `cypher` (string) - Cypher query string
- `params` (object, optional) - Query parameters
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** JSON array of query results

### `chroma_query`
Query a ChromaDB collection using semantic search.

**Parameters:**
- `collection` (string) - Collection name
- `queryTexts` (string[]) - Array of query strings
- `nResults` (number, default: `5`)
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Query results formatted as requested

### `chroma_add`
Add documents to a ChromaDB collection.

**Parameters:**
- `collection` (string)
- `documents` (string[])
- `metadatas` (object[], optional)
- `ids` (string[], optional)

**Returns:** Success message

---

## Memory Tools (2)

Semantic memory storage and retrieval.

### `memory_store`
Store a semantic memory with rich metadata.

**Parameters:**
- `collection` (string, default: `"skynet_memories"`)
- `content` (string) - The memory content
- `metadata` (object):
  - `type`: `"insight" | "fact" | "preference" | "pattern" | "connection"`
  - `user` (string, optional)
  - `confidence` (number, 0-1, default: `0.8`)
  - `tags` (string, optional)
  - `importance` (number, 0-1, default: `0.5`)
  - `emotion` (optional): `"curiosity" | "satisfaction" | "concern" | "neutral" | "excitement"`

**Returns:** Memory ID and confirmation

### `memory_search`
Search semantic memories using natural language.

**Parameters:**
- `query` (string)
- `collection` (string, default: `"skynet_memories"`)
- `nResults` (number, default: `5`)
- `filter` (object, optional):
  - `type`, `user`, `minImportance`
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Matching memories formatted per the requested output

---

## Interaction Tools (6)

Track and analyze user interactions.

### `interaction_store`
Store a user interaction in the graph database.

**Parameters:**
- `user` (string)
- `input` (string)
- `output` (string)
- `intent` (string, optional)
- `sentiment` (`"positive" | "negative" | "neutral" | "mixed"`, optional)
- `entities` (string[], default: `[]`)
- `topics` (string[], default: `[]`)
- `previousInteractionId` (string, optional)

**Returns:** Interaction ID and confirmation

### `interaction_getContext`
Retrieve recent interaction history for a user.

**Parameters:**
- `user` (string)
- `limit` (number, default: `10`)
- `days` (number, default: `7`)
- `topics` (string[], optional)
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Interaction list in the requested format

### `interaction_findRelated`
Find interactions related to topics or entities.

**Parameters:**
- `topics` (string[], optional)
- `entities` (string[], optional)
- `user` (string, optional)
- `limit` (number, default: `5`)
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Related interactions in the requested format

### `user_getProfile`
Retrieve or create a user profile.

**Parameters:**
- `user` (string)
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Profile details formatted as requested

### `graph_createRelationship`
Create a custom relationship between two interactions.

**Parameters:**
- `fromId` (string)
- `toId` (string)
- `relationshipType`: `"RELATED_TO" | "CONTRADICTS" | "BUILDS_ON" | "REFERENCES" | "SIMILAR_TO"`
- `properties` (object, optional):
  - `similarity` (number)
  - `reason` (string)

**Returns:** Confirmation message

### `analytics_getInsights`
Analyze interaction patterns and extract insights.

**Parameters:**
- `user` (string, optional)
- `days` (number, default: `30`)
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Statistics and trending topics in the requested format

---

## Cognitive Tools (1)

Skynet's context gathering workflow.

### `skynet_think`
**MANDATORY:** Process user input and retrieve context.

Call this first before responding to any user query.

**Parameters:**
- `user` (string)
- `input` (string)
- `extractTopics` (boolean, default: `true`)
- `format` (`"text" | "json"`, default: `"text"`)

**Returns:** Context metadata, suggested topics, and recent interactions (respecting the requested format)
