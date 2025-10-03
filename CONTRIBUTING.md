# Contributing to Skynet MCP

First off, thank you for considering contributing to Skynet MCP! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project follows a simple code of conduct:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project and community
- Show empathy towards other contributors

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/patgpt/patgpt-mcp/issues) to avoid duplicates.

When creating a bug report, use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Bun version, etc.)
- Relevant logs or error messages

### Suggesting Features

Feature suggestions are welcome! Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) and include:

- Clear use case
- Proposed solution
- Alternative approaches considered
- Example implementation (if applicable)

### Improving Documentation

Documentation improvements are always appreciated:

- Fix typos or unclear explanations
- Add examples or use cases
- Improve API documentation
- Translate documentation

Use our [documentation template](.github/ISSUE_TEMPLATE/documentation.yml) for doc-related issues.

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues for newcomers
- `help wanted` - Issues where we need help
- `documentation` - Documentation improvements

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Docker](https://docker.com) (for databases)
- [Git](https://git-scm.com)

### Setup Steps

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/patgpt-mcp.git
   cd patgpt-mcp
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Start Databases**
   ```bash
   docker-compose up -d
   ```

4. **Run Development Server**
   ```bash
   bun dev
   ```

5. **Run Tests**
   ```bash
   bun test
   ```

### Project Structure

```
patgpt-mcp/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript definitions
│   ├── db/                   # Database clients
│   │   ├── memgraph.ts       # Graph database
│   │   ├── chroma.ts         # Vector database
│   │   └── docker.ts         # Docker client
│   └── tools/                # MCP tool implementations
│       ├── infrastructure.ts # Container management
│       ├── database.ts       # DB access
│       ├── memory.ts         # Semantic memory
│       ├── interactions.ts   # User tracking
│       └── cognitive.ts      # Skynet workflow
├── tests/                    # Test suite
├── docs/                     # VitePress documentation
└── dist/                     # Build output
```

## Pull Request Process

### Before Submitting

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Your Changes**
   - Follow our coding standards
   - Add tests for new features
   - Update documentation

3. **Run Tests**
   ```bash
   bun test
   bun run typecheck
   ```

4. **Build**
   ```bash
   bun run build:all
   ```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

**Examples:**
```bash
git commit -m "feat(memory): add batch memory storage"
git commit -m "fix(database): handle ChromaDB connection timeout"
git commit -m "docs(api): update cognitive tools examples"
```

### Pull Request Template

When creating a PR, include:

- **Description**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Changes**: List of changes made
- **Testing**: How was this tested?
- **Screenshots**: If applicable
- **Related Issues**: Link to related issues

### PR Checklist

- [ ] Tests pass (`bun test`)
- [ ] Type check passes (`bun run typecheck`)
- [ ] Build succeeds (`bun run build:all`)
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main
- [ ] No merge conflicts

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Define types for all functions and variables
- Avoid `any` type

### Code Style

We use Biome for linting and formatting:

```bash
# Check formatting
bun biome check .

# Fix formatting
bun biome check --apply .
```

**Key conventions:**
- Use `const` over `let` when possible
- Use async/await over promises
- Use descriptive variable names
- Keep functions small and focused
- Add comments for complex logic

### File Organization

- One tool per function
- Group related functionality
- Export named exports
- Use barrel exports (index.ts)

### Error Handling

```typescript
try {
  // Operation
} catch (error) {
  // Provide context in error messages
  throw new Error(`Failed to perform X: ${error.message}`);
}
```

## Testing Guidelines

### Writing Tests

Tests use Bun's native test runner:

```typescript
import { describe, expect, test } from "bun:test";

describe("Feature Name", () => {
  test("should do something", () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Test Coverage

- Write tests for all new features
- Test edge cases and error conditions
- Mock external dependencies
- Use descriptive test names

### Running Tests

```bash
# All tests
bun test

# Watch mode
bun test:watch

# Specific file
bun test tests/memory.test.ts

# Integration tests (requires Docker)
RUN_INTEGRATION=1 bun test
```

## Documentation

### Code Documentation

Use JSDoc comments for functions:

```typescript
/**
 * Store a semantic memory with metadata
 * @param content - The memory content
 * @param metadata - Structured metadata
 * @returns Memory ID and storage details
 */
async function memoryStore(
  content: string,
  metadata: MemoryMetadata
): Promise<MemoryResult>
```

### Documentation Site

Update docs in the `docs/` directory:

```bash
# Run docs locally
bun run docs:dev

# Build docs
bun run docs:build
```

Documentation structure:
- `docs/guide/` - User guides
- `docs/api/` - API reference
- `docs/api-generated/` - Auto-generated from code

### README Updates

Update README.md when:
- Adding new tools
- Changing installation process
- Updating usage examples
- Modifying configuration

## Release Process

Contributors don't need to worry about releases - maintainers handle this.

If you're interested in the process, see [RELEASE.md](RELEASE.md).

## Getting Help

- 📖 Read the [documentation](https://patgpt.github.io/patgpt-mcp/)
- 💬 Start a [discussion](https://github.com/patgpt/patgpt-mcp/discussions)
- ❓ Open a [question issue](.github/ISSUE_TEMPLATE/question.yml)
- 💡 Check existing issues and PRs

## Recognition

All contributors are:
- Listed in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Mentioned in release notes
- Credited in commit history

Significant contributions may also be recognized in the README.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Skynet MCP! 🚀
