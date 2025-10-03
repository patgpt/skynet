# Infrastructure Tools

Tools for managing Docker containers and database infrastructure.

## stack_up

Start or ensure local Memgraph and ChromaDB containers are running.

**Parameters:**
- `memgraphImage` (string, optional): Docker image for Memgraph. Default: `"memgraph/memgraph:latest"`
- `memgraphPort` (integer, optional): Host port for Memgraph bolt protocol. Default: `7687`
- `chromaImage` (string, optional): Docker image for ChromaDB. Default: `"ghcr.io/chroma-core/chroma:latest"`
- `chromaPort` (integer, optional): Host port for ChromaDB API. Default: `8000`

**Returns:**
```typescript
{
  memgraph: {
    containerId: string,
    port: number,
    status: "started" | "already_running"
  },
  chroma: {
    containerId: string,
    port: number,
    status: "started" | "already_running"
  }
}
```

**Example:**
```typescript
await stackUp({
  memgraphPort: 7687,
  chromaPort: 8000
});
```

**Use Cases:**
- Initialize infrastructure before first use
- Recover from container failures
- Automate development environment setup

---

## stack_down

Stop and remove Memgraph and ChromaDB containers.

**Parameters:**
- `force` (boolean, optional): Force remove containers even if running. Default: `true`

**Returns:**
```typescript
{
  memgraph: {
    stopped: boolean,
    removed: boolean
  },
  chroma: {
    stopped: boolean,
    removed: boolean
  }
}
```

**Example:**
```typescript
await stackDown({ force: true });
```

**Use Cases:**
- Clean shutdown of infrastructure
- Reset environment to clean state
- Resource cleanup during testing

**Warning:** This will stop containers and may result in data loss if volumes are not persisted.

---

## stack_status

Get running state and container IDs for Memgraph and ChromaDB.

**Parameters:** None

**Returns:**
```typescript
{
  memgraph: {
    containerId: string | null,
    running: boolean,
    port?: number
  },
  chroma: {
    containerId: string | null,
    running: boolean,
    port?: number
  }
}
```

**Example:**
```typescript
const status = await stackStatus();
if (status.memgraph.running) {
  console.log("Memgraph ready on port", status.memgraph.port);
}
```

**Use Cases:**
- Health checks before operations
- Debugging container issues
- Monitoring infrastructure state

---

## Technical Details

### Container Configuration

**Memgraph:**
- Image: `memgraph/memgraph:latest`
- Protocol: Bolt (Neo4j-compatible)
- Default Port: 7687
- Volume: `memgraph-data` (persisted storage)
- Network: `mcp-network` (shared with ChromaDB)

**ChromaDB:**
- Image: `ghcr.io/chroma-core/chroma:latest`
- Protocol: HTTP REST API
- Default Port: 8000
- Volume: `chroma-data` (persisted storage)
- Network: `mcp-network` (shared with Memgraph)
- Environment:
  - `CHROMA_SERVER_HOST=0.0.0.0`
  - `PERSIST_DIRECTORY=/data`

### Error Handling

All infrastructure tools handle common error scenarios:

- **Docker daemon not running**: Returns error with helpful message
- **Port conflicts**: Attempts to use existing container if ports match
- **Container in unexpected state**: Cleanup and restart
- **Network/volume issues**: Automatic creation if missing

### Best Practices

1. **Check status first**: Use `stack_status` before operations
2. **Graceful shutdown**: Use `stack_down` instead of `docker stop`
3. **Environment-specific ports**: Use parameters to avoid conflicts
4. **Health monitoring**: Poll `stack_status` after `stack_up`

### See Also

- [Database Tools](/api/database) - Query and manipulate data
- [Setup Guide](/guide/setup) - Initial infrastructure setup
- [Architecture](/guide/architecture) - Infrastructure overview
