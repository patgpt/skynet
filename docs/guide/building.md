# Building for Production

## Build Process

Skynet MCP uses Bun's bundler to create optimized production builds with tree-shaking and minification.

## Quick Build

```bash
bun run build
```

This generates:
- **dist/index.js** - Minified production bundle (~3.9 MB)
- Source maps (if enabled)

## Build Configuration

The build is configured in `package.json`:

```json
{
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target node --minify --external cohere-ai --external @google/generative-ai --external openai"
  }
}
```

### Build Options Explained

| Option | Purpose |
|--------|---------|
| `--outdir dist` | Output directory for build artifacts |
| `--target node` | Target Node.js runtime (compatible with Bun) |
| `--minify` | Minify code for smaller bundle size |
| `--external` | Exclude heavy dependencies from bundle |

### External Dependencies

These dependencies are excluded from the bundle to reduce size:

- **cohere-ai** - Cohere AI SDK
- **@google/generative-ai** - Google Generative AI SDK  
- **openai** - OpenAI SDK

They must be installed in `node_modules` at runtime.

## Build Optimization

### Bundle Size Reduction

Original bundle: **9.6 MB**  
Optimized bundle: **3.9 MB** (60% reduction)

Optimization techniques:
1. ✅ Tree-shaking unused code
2. ✅ Minification
3. ✅ External dependencies
4. ✅ No source maps in production

### Performance Tips

```bash
# Analyze bundle size
bun build src/index.ts --outdir dist --target node --minify | grep -E "(KB|MB)"

# Check external dependencies
ls -lh node_modules/cohere-ai node_modules/@google node_modules/openai
```

## Deployment

### 1. Build the Bundle

```bash
bun run build
```

### 2. Package for Distribution

```bash
# Create tarball
tar -czf skynet-mcp-v1.0.0.tar.gz dist/ node_modules/ package.json

# Or zip
zip -r skynet-mcp-v1.0.0.zip dist/ node_modules/ package.json
```

### 3. Deploy to Server

```bash
# Upload and extract
scp skynet-mcp-v1.0.0.tar.gz server:/opt/skynet-mcp/
ssh server "cd /opt/skynet-mcp && tar -xzf skynet-mcp-v1.0.0.tar.gz"

# Install dependencies (if needed)
ssh server "cd /opt/skynet-mcp && bun install --production"
```

### 4. Configure MCP Client

Point your MCP client to the production bundle:

```json
{
  "servers": {
    "skynet": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "/opt/skynet-mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "MEMGRAPH_BOLT_URL": "bolt://memgraph:7687",
        "CHROMA_URL": "http://chroma:8000"
      }
    }
  }
}
```

## Docker Deployment

### Build Docker Image

```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --production

# Copy source and build
COPY src/ ./src/
RUN bun run build

# Expose MCP stdio interface
CMD ["bun", "run", "dist/index.js"]
```

Build and run:
```bash
docker build -t skynet-mcp:latest .
docker run -it --rm \
  -e MEMGRAPH_BOLT_URL=bolt://host.docker.internal:7687 \
  -e CHROMA_URL=http://host.docker.internal:8000 \
  skynet-mcp:latest
```

## Environment Variables

Production environment variables:

```bash
# Required
MEMGRAPH_BOLT_URL=bolt://localhost:7687
CHROMA_URL=http://localhost:8000

# Optional
NODE_ENV=production
LOG_LEVEL=info
MEMGRAPH_USER=
MEMGRAPH_PASS=
```

## Verification

### Test Production Build

```bash
# Build
bun run build

# Run tests against build
NODE_ENV=production bun test

# Manual smoke test
bun run dist/index.js
```

### Health Checks

```bash
# Check bundle size
ls -lh dist/index.js

# Verify no missing dependencies
bun run dist/index.js --help 2>&1 | grep -i error

# Check database connections
docker ps --filter "name=mcp-"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun test
      
      - name: Build
        run: bun run build
      
      - name: Create release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/index.js
```

## Performance Monitoring

### Startup Time

```bash
time bun run dist/index.js
```

### Memory Usage

```bash
# Monitor during operation
ps aux | grep "bun run dist/index.js"

# Or use Docker stats
docker stats mcp-memgraph mcp-chroma
```

## Troubleshooting

### "Module not found" errors
- Ensure external dependencies are installed: `bun install --production`

### Bundle too large
- Verify external dependencies are excluded
- Check for unnecessary imports in source code

### Runtime errors after build
- Test build locally before deploying: `bun run dist/index.js`
- Check environment variables are set correctly

## Next Steps

- [Deployment Guide](https://github.com/yourusername/patgpt-mcp/DEPLOYMENT.md)
- [API Reference](/api/)
- [Architecture Overview](/guide/architecture)
