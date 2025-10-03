# <img src="./public/logo.png" alt="Skynet MCP Logo" width="120" align="left" />

# Skynet MCP Server

Advanced Model Context Protocol server with persistent memory using Memgraph (graph DB) and ChromaDB (vector DB).


[![Documentation](https://img.shields.io/badge/docs-VitePress-blue)](https://patgpt.github.io/skynet/)
[![Tests](https://img.shields.io/badge/tests-passing-green)](#testing)
[![Build Size](https://img.shields.io/badge/build-3.9MB-brightgreen)](#production)
[![Release](https://img.shields.io/github/v/release/patgpt/skynet)](https://github.com/patgpt/skynet/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<!-- Tech Stack Badges -->
<p>
	<a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-%2300B6FF.svg?logo=bun&logoColor=white" alt="Bun" /></a>
	<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" /></a>
	<a href="https://biomejs.dev/"><img src="https://img.shields.io/badge/Biome-%2332C766.svg?logo=biome&logoColor=white" alt="Biome" /></a>
	<a href="https://vitepress.dev/"><img src="https://img.shields.io/badge/VitePress-%23646CFF.svg?logo=vite&logoColor=white" alt="VitePress" /></a>
	<a href="https://memgraph.com/"><img src="https://img.shields.io/badge/Memgraph-%2300B6FF.svg?logo=memgraph&logoColor=white" alt="Memgraph" /></a>
	<a href="https://www.trychroma.com/"><img src="https://img.shields.io/badge/ChromaDB-%23FF6F61.svg?logo=chroma&logoColor=white" alt="ChromaDB" /></a>
</p>

## 📚 Documentation

Comprehensive documentation is available at [patgpt.github.io/skynet](https://patgpt.github.io/skynet/)

**Quick Links:**
- [Getting Started](https://patgpt.github.io/skynet/guide/)
- [Architecture](https://patgpt.github.io/skynet/guide/architecture)
- [API Reference](https://patgpt.github.io/skynet/api/)
- [Tools Overview](https://patgpt.github.io/skynet/guide/tools)

### Local Documentation

```bash
# Install dependencies
bun install

# Run documentation locally
bun run docs:dev

# Build documentation
bun run docs:build

# Generate TypeDoc API docs
bun run docs:api
```

## Quick Start

```bash
# Install dependencies
bun install

# Start databases (Docker required)
docker-compose up -d

# Development (hot-reload)
bun dev

# Run tests
bun test

# Build for production
bun run build
```

## Project Structure

```
skynet/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript definitions
│   ├── db/                   # Database clients
│   │   ├── memgraph.ts       # Graph DB (Memgraph)
│   │   ├── chroma.ts         # Vector DB (ChromaDB)
│   │   └── docker.ts         # Docker client
│   └── tools/                # MCP tool implementations
│       ├── infrastructure.ts # Container management (3 tools)
│       ├── database.ts       # DB access (4 tools)
│       ├── memory.ts         # Semantic memory (2 tools)
│       ├── interactions.ts   # User tracking (6 tools)
│       └── cognitive.ts      # Skynet workflow (3 tools)
├── tests/                    # Test suite (Bun)
├── docs/                     # VitePress documentation
│   ├── .vitepress/config.ts  # VitePress config
│   ├── guide/                # User guides
│   ├── api/                  # API reference
│   └── api-generated/        # TypeDoc output
└── dist/                     # Production build
```

## Tools (18 total)

### Infrastructure (3 tools)
- `stack_up` - Start Memgraph & ChromaDB containers
- `stack_down` - Stop containers
- `stack_status` - Check container status

### Database (4 tools)
- `graph_query` - Execute Cypher queries on Memgraph
- `chroma_query` - Semantic search in ChromaDB
- `chroma_add` - Add documents to ChromaDB
- `add` - Math utility (testing)

### Memory (2 tools)
- `memory_store` - Store semantic memories with metadata
- `memory_search` - Search memories by query

### Interactions (6 tools)
- `interaction_store` - Store user interactions in graph
- `interaction_getContext` - Get user history
- `interaction_findRelated` - Find related interactions
- `user_getProfile` - Get/create user profile
- `graph_createRelationship` - Link interactions
- `analytics_getInsights` - Analyze conversation patterns

### Cognitive (3 tools)
- `skynet_think` - Process input & retrieve context
- `skynet_respond` - Store AI responses
- `skynet_validateMemory` - Validate memory storage

See [Tools Overview](https://patgpt.github.io/skynet/guide/tools) for detailed documentation.

## Development

```bash
bun dev            # Hot-reload development
bun test           # Run tests
bun test:watch     # Watch mode
bun run typecheck  # Type checking only
```

### Documentation Development

```bash
bun run docs:dev     # Start VitePress dev server
bun run docs:build   # Build static site
bun run docs:preview # Preview built site
bun run docs:api     # Generate TypeDoc API docs
```

## Production

```bash
# Build optimized bundle
bun run build

# Run production build
bun run dist/index.js
```

**Build Optimization:**
- Minified bundle: **3.9 MB** (60% reduction from 9.6 MB)
- Tree-shaking enabled
- External dependencies: `cohere-ai`, `@google/generative-ai`, `openai`

## Testing

```bash
bun test                    # Run all tests
bun test:watch              # Watch mode
RUN_INTEGRATION=1 bun test  # Include integration tests
```

**Test Coverage:**
- ✅ 11 passing tests
- ⏭️ 2 skipped (integration tests - require Docker)
- 📁 6 test files covering all tool categories

## Deployment

### GitHub Pages

Documentation automatically deploys to GitHub Pages on push to `main`:

```yaml
# .github/workflows/docs.yml
- Build VitePress site
- Generate TypeDoc API docs
- Deploy to gh-pages branch
```

### Docker Deployment

```bash
# Using docker-compose
docker-compose up -d

# Or manually
docker run -d -p 7687:7687 memgraph/memgraph:latest
docker run -d -p 8000:8000 chromadb/chroma:latest
```

## Environment Configuration

Create `.env` (optional, defaults provided):

```bash
# Memgraph
MEMGRAPH_BOLT_URL=bolt://localhost:7687
MEMGRAPH_USER=
MEMGRAPH_PASS=

# ChromaDB
CHROMA_URL=http://localhost:8000

# Docker (if non-standard)
# DOCKER_HOST=unix:///var/run/docker.sock
```

## Architecture

**Databases:**
- **Memgraph**: Graph database for interaction relationships
- **ChromaDB**: Vector database for semantic memory

**Workflow:**
1. User query → `skynet_think` (retrieve context)
2. Process query with context
3. Generate response
4. `skynet_respond` (store interaction)
5. `skynet_validateMemory` (verify storage)

See [Architecture Guide](https://patgpt.github.io/skynet/guide/architecture) for details.

## Releases

### Creating a Release

```bash
# Option 1: Use the helper script
./scripts/create-release.sh v1.0.0 "Initial release"

# Option 2: Manual process
bun run release              # Test and build
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0       # Triggers CI release
```

See [RELEASE.md](RELEASE.md) for detailed release instructions.

### Installing from Release

```bash
# Download latest release
wget https://github.com/patgpt/skynet/releases/latest/download/skynet-mcp-v1.0.0.tar.gz

# Extract and install
tar -xzf skynet-mcp-v1.0.0.tar.gz
cd skynet-mcp-v1.0.0
bun install --production
docker-compose up -d
bun run dist/index.js
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

**Quick start:**
1. Fork the repository
2. Create a feature branch
3. Write tests for changes
4. Ensure all tests pass: `bun test`
5. Submit pull request

See our [contributors](CONTRIBUTORS.md) for a list of people who have helped make this project better.


## Contributors

Special thanks to our core contributors:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<table>
	<tr>
		<td align="center"><a href="https://github.com/scottonanski"><img src="https://github.com/scottonanski.png" width="100px;" alt="scottonanski"/><br /><sub><b>scottonanski</b></sub></a><br /><span title="Code">💻</span> <span title="Docs">📖</span> <span title="Ideas">💡</span></td>
		<td align="center"><a href="https://github.com/Saluana"><img src="https://github.com/Saluana.png" width="100px;" alt="Saluana"/><br /><sub><b>Saluana</b></sub></a><br /><span title="Code">💻</span> <span title="Docs">📖</span> <span title="Ideas">💡</span></td>
	</tr>
</table>
<!-- ALL-CONTRIBUTORS-LIST:END -->

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the full list of contributors.

## License

MIT - See [LICENSE](LICENSE) for details.

---

**Built with:**
- [Bun](https://bun.sh) - Runtime & build tool
- [FastMCP](https://github.com/jlowin/fastmcp) - MCP server framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [VitePress](https://vitepress.dev/) - Documentation
- [Memgraph](https://memgraph.com/) - Graph database
- [ChromaDB](https://www.trychroma.com/) - Vector database

 
