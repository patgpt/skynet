# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive VitePress documentation
- TypeDoc API documentation generation
- GitHub Pages deployment workflow
- Release CI workflow with automated releases
- 18 MCP tools across 5 categories

### Changed
- Restructured project to modular architecture
- Optimized production build (60% size reduction to 3.9MB)

### Fixed
- ChromaDB client initialization

## [1.0.0] - 2025-10-03

### Added
- Initial release
- Memgraph (graph database) integration
- ChromaDB (vector database) integration
- Docker container management
- Semantic memory storage and search
- User interaction tracking
- Conversation graph building
- Skynet cognitive workflow
- Comprehensive test suite with Bun

### Infrastructure Tools (3)
- `stack_up` - Start database containers
- `stack_down` - Stop database containers
- `stack_status` - Check container status

### Database Tools (4)
- `graph_query` - Execute Cypher queries
- `chroma_query` - Semantic search
- `chroma_add` - Add documents
- `add` - Utility function

### Memory Tools (2)
- `memory_store` - Store semantic memories
- `memory_search` - Search memories

### Interaction Tools (6)
- `interaction_store` - Store user interactions
- `interaction_getContext` - Get user history
- `interaction_findRelated` - Find related interactions
- `user_getProfile` - Get/create user profile
- `graph_createRelationship` - Link interactions
- `analytics_getInsights` - Analyze patterns

### Cognitive Tools (3)
- `skynet_think` - Process input & retrieve context
- `skynet_respond` - Store AI responses
- `skynet_validateMemory` - Validate memory storage

[Unreleased]: https://github.com/patgpt/skynet/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/patgpt/skynet/releases/tag/v1.0.0
