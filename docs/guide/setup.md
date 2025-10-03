# Setup

## Prerequisites

- [Bun](https://bun.sh) v1.0+ installed
- [Docker](https://docker.com) installed and running
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://patgpt/skynet.git
cd skynet
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Configuration

Create a `.env` file (optional, defaults provided):

```bash
# Memgraph (Graph Database)
MEMGRAPH_BOLT_URL=bolt://localhost:7687
MEMGRAPH_USER=
MEMGRAPH_PASS=

# ChromaDB (Vector Database)
CHROMA_URL=http://localhost:8000

# Docker (if non-standard)
# DOCKER_HOST=unix:///var/run/docker.sock
```

### 4. Start Databases

Using Docker Compose:
```bash
docker-compose up -d
```

Or manually with Docker:
```bash
# Memgraph
docker run -d --name mcp-memgraph \
  -p 7687:7687 \
  -v memgraph-data:/var/lib/memgraph \
  memgraph/memgraph:latest

# ChromaDB
docker run -d --name mcp-chroma \
  -p 8000:8000 \
  -v chroma-data:/data \
  -e CHROMA_SERVER_HOST=0.0.0.0 \
  -e PERSIST_DIRECTORY=/data \
  chromadb/chroma:latest
```

### 5. Verify Installation

```bash
# Check containers are running
docker ps --filter "name=mcp-"

# Run tests
bun test

# Start development server
bun dev
```

## MCP Configuration

Add to `.vscode/mcp.json` or your MCP client configuration:

```json
{
  "servers": {
    "skynet": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "dist/index.js"],
      "cwd": "/path/to/skynet",
      "env": {
        "MEMGRAPH_BOLT_URL": "bolt://localhost:7687",
        "CHROMA_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Development Workflow

```bash
# Hot-reload development
bun dev

# Run tests in watch mode
bun test:watch

# Type check
bun run typecheck

# Build for production
bun run build
```

## Troubleshooting

### "Docker daemon not found"
Make sure Docker is running:
```bash
docker info
```

### "Cannot connect to Memgraph"
Check if Memgraph container is running:
```bash
docker logs mcp-memgraph
```

### "ChromaDB connection refused"
Check if ChromaDB container is running:
```bash
docker logs mcp-chroma
```

### Port conflicts
If ports 7687 or 8000 are in use, update your `.env` file and restart containers.

## Next Steps

- [Testing Guide](/guide/testing)
- [Building for Production](/guide/building)
- [API Reference](/api/)
