# Getting Started

## Installation

```bash
bun install
```

## Quick Start

### 1. Start Docker Containers

The server requires Memgraph (graph database) and ChromaDB (vector database):

```bash
docker-compose up -d
```

Or use the MCP tool:
```bash
# The stack_up tool will be available once the server is running
```

### 2. Development Mode

```bash
bun dev
```

This starts the server with hot-reload enabled. Any changes to `src/**/*.ts` files will automatically restart the server.

### 3. Run Tests

```bash
bun test
```

### 4. Build for Production

```bash
bun run build
```

## Project Overview

Skynet MCP Server is an advanced Model Context Protocol server that provides:

- **Persistent Memory**: Store and retrieve semantic memories using ChromaDB
- **Relationship Tracking**: Graph-based interaction history with Memgraph
- **18 MCP Tools**: Comprehensive toolkit for AI assistants
- **Type Safety**: Full TypeScript with strict mode
- **Production Ready**: Optimized builds, Docker support, comprehensive tests

## Next Steps

- [Architecture Overview](/guide/architecture) - Understand the system design
- [Tools Overview](/guide/tools) - Learn about available MCP tools
- [API Reference](/api/) - Detailed API documentation
