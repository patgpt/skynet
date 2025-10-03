# Skynet MCP Server

Advanced Model Context Protocol server with persistent memory using Memgraph (graph DB) and ChromaDB (vector DB).

## Quick Start

```bash
# Install dependencies
bun install

# Development (hot-reload)
bun dev

# Run tests
bun test

# Build for production
bun run build
```

## Project Structure

- `src/` - Source code
  - `index.ts` - Main entry point
  - `types.ts` - TypeScript definitions
  - `db/` - Database clients (Memgraph, ChromaDB, Docker)
  - `tools/` - MCP tool implementations
    - `infrastructure.ts` - Container management
    - `database.ts` - DB access tools
    - `memory.ts` - Semantic memory storage
    - `interactions.ts` - Interaction tracking
    - `cognitive.ts` - Skynet cognitive workflow
- `tests/` - Test suite (Bun test runner)
- `dist/` - Production build output

## Tools

**Infrastructure** (3 tools)
- `stack_up` - Start Docker containers
- `stack_down` - Stop Docker containers
- `stack_status` - Check container status

**Database** (4 tools)
- `graph_query` - Execute Cypher queries
- `chroma_query` - Semantic search
- `chroma_add` - Add documents
- `add` - Simple addition (testing)

**Memory** (2 tools)
- `memory_store` - Store semantic memories
- `memory_search` - Search memories

**Interactions** (6 tools)
- `interaction_store` - Store interaction
- `interaction_getContext` - Get user history
- `interaction_findRelated` - Find related interactions
- `user_getProfile` - Get user profile
- `graph_createRelationship` - Link interactions
- `analytics_getInsights` - Analyze patterns

**Cognitive** (3 tools)
- `skynet_think` - Process user input
- `skynet_respond` - Store AI response
- `skynet_validateMemory` - Validate storage

**Total: 18 tools**

## Development

```bash
bun dev          # Hot-reload development
bun test         # Run tests
bun test:watch   # Watch mode
bun run typecheck # Type checking only
```

## Production

```bash
bun run build    # Build optimized bundle (3.9MB)
bun run dist/index.js # Run production build
```

## Testing

- Unit tests for tool registration
- Integration tests for Docker operations
- All tests use Bun's native test runner

```
✓ 11 passing tests
✓ 2 skipped (integration)
✓ 6 test files
```

---

Built with [Bun](https://bun.sh) + [FastMCP](https://github.com/jlowin/fastmcp) + TypeScript
