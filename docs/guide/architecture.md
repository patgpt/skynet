# Architecture

## System Overview

Skynet MCP Server uses a dual-database architecture for comprehensive AI memory:

```
┌─────────────────────────────────────────┐
│         MCP Client (AI Assistant)       │
└────────────────┬────────────────────────┘
                 │
                 │ Model Context Protocol
                 │
┌────────────────▼────────────────────────┐
│       Skynet MCP Server (FastMCP)       │
│  ┌──────────────────────────────────┐   │
│  │     18 Tools (5 Categories)      │   │
│  └──────────────────────────────────┘   │
└─────┬────────────────────────┬──────────┘
      │                        │
      │                        │
┌─────▼──────────┐      ┌──────▼─────────┐
│   Memgraph     │      │   ChromaDB     │
│  (Graph DB)    │      │  (Vector DB)   │
│                │      │                │
│ • Interactions │      │ • Memories     │
│ • Users        │      │ • Embeddings   │
│ • Topics       │      │ • Semantic     │
│ • Relations    │      │   Search       │
└────────────────┘      └────────────────┘
```

## Components

### Database Layer

#### Memgraph (Graph Database)
- Stores **interactions** between users and AI
- Tracks **relationships** (FOLLOWS, ABOUT, INITIATED)
- Maintains **user profiles** with interaction history
- Enables **topic tracking** and trend analysis

#### ChromaDB (Vector Database)
- Stores **semantic memories** as embeddings
- Enables **similarity search** for context retrieval
- Supports **metadata filtering** (type, user, importance)
- Handles **preference storage** and insights

### Tool Categories

#### 1. Infrastructure Tools (3)
- Container management via Docker API
- Network and volume orchestration
- Health monitoring

#### 2. Database Tools (4)
- Direct Cypher query execution
- Vector search and indexing
- Document storage
- Testing utilities

#### 3. Memory Tools (2)
- Semantic memory storage with metadata
- Context-aware memory retrieval
- Importance and confidence scoring

#### 4. Interaction Tools (6)
- Full interaction lifecycle tracking
- User profile management
- Topic and entity extraction
- Analytics and insights

#### 5. Cognitive Tools (3)
- Pre-processing workflow (skynet_think)
- Post-processing storage (skynet_respond)
- Memory validation

## Data Flow

### Storing an Interaction

```
User Input
    │
    ▼
skynet_think()
    │ (Extract context, topics)
    ▼
AI Processing
    │
    ▼
skynet_respond()
    │
    ├──► Memgraph: Store interaction node
    │              Create relationships
    │              Link topics
    │
    └──► ChromaDB: Store semantic memory (optional)
                   Create embedding
```

### Retrieving Context

```
User Query
    │
    ▼
memory_search()
    │ (Semantic search)
    ▼
ChromaDB: Find similar memories
    │
    ▼
interaction_getContext()
    │ (Graph traversal)
    ▼
Memgraph: Get recent interactions
    │
    ▼
Combine Results → Return Context
```

## Design Patterns

### 1. Modular Architecture
- Each tool category in separate module
- Database clients isolated from business logic
- Type definitions centralized

### 2. Session Management
- Automatic session lifecycle for graph queries
- Proper cleanup in finally blocks
- Connection pooling

### 3. Type Safety
- Zod schemas for runtime validation
- TypeScript interfaces for compile-time safety
- Strict mode enabled

### 4. Error Handling
- Try-catch-finally for database operations
- Graceful degradation
- Meaningful error messages

## Scalability Considerations

### Horizontal Scaling
- Stateless server design
- Database clustering support (Memgraph, Chroma)
- Load balancer compatible

### Performance
- Minified production builds (3.9MB)
- Indexed database queries
- Connection pooling
- Caching opportunities

### Monitoring
- Container health checks
- Query performance metrics
- Memory usage tracking
