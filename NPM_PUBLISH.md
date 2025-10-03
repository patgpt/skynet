# NPM Publishing Guide for Skynet MCP

This guide walks through publishing Skynet MCP to npm registry.

## Prerequisites

1. **npm Account**: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI Access**: Run `npm login` to authenticate
3. **Package Name**: Check availability at [npmjs.com/package/skynet-mcp](https://www.npmjs.com/package/skynet-mcp)

## 1. Configure package.json for npm

### Update Package Metadata

```json
{
  "name": "@patgpt/skynet-mcp",
  "version": "1.0.0",
  "description": "Advanced Model Context Protocol server with persistent memory using Memgraph and ChromaDB",
  "keywords": [
    "mcp",
    "model-context-protocol",
    "ai",
    "memory",
    "graph-database",
    "vector-database",
    "memgraph",
    "chromadb",
    "fastmcp"
  ],
  "author": "PatGPT",
  "license": "MIT",
  "homepage": "https://patgpt.github.io/patgpt-mcp/",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/patgpt/patgpt-mcp.git"
  },
  "bugs": {
    "url": "https://github.com/patgpt/patgpt-mcp/issues"
  },
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "skynet-mcp": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "docker-compose.yml"
  ],
  "engines": {
    "node": ">=18.0.0",
    "bun": ">=1.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### Remove `"private": true`

The current `package.json` has `"private": true` which prevents publishing. Remove this line.

## 2. Update Build Configuration

### Add TypeScript Declaration Generation

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false,
    "outDir": "./dist"
  }
}
```

### Update Build Script

Modify the build script in `package.json`:

```json
{
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node --minify --external cohere-ai --external @google/generative-ai --external openai && tsc --emitDeclarationOnly",
    "prepublishOnly": "bun run build && bun test"
  }
}
```

## 3. Add .npmignore

Create `.npmignore` to exclude unnecessary files:

```
# Source files
src/
tests/
docs/

# Development
.github/
.vscode/
scripts/

# Build artifacts
*.tsbuildinfo
.vitepress/

# Docs
RELEASE.md
CONTRIBUTING.md

# Development configs
tsconfig.json
biome.json
typedoc.json

# Environment
.env
.env.*

# Misc
.DS_Store
*.log
```

## 4. Verify Package Contents

Before publishing, verify what will be included:

```bash
npm pack --dry-run
```

This shows:
- Package size
- Files to be included
- Any warnings

## 5. Publishing Workflow

### Option A: Manual Publishing

```bash
# 1. Ensure you're logged in
npm whoami

# 2. Update version
npm version patch  # or minor, major

# 3. Build and test
bun run build
bun test

# 4. Publish
npm publish --access public

# 5. Push tags
git push origin main --tags
```

### Option B: Automated Publishing with GitHub Actions

Create `.github/workflows/npm-publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build
      
      - name: Test
        run: bun test
      
      - name: Publish to npm
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup npm Token for GitHub Actions

1. Generate npm token: `npm token create`
2. Add to GitHub Secrets:
   - Go to repo Settings → Secrets → Actions
   - Create `NPM_TOKEN` secret
   - Paste your npm token

## 6. Version Management

### Semantic Versioning

- **Patch** (`1.0.1`): Bug fixes
  ```bash
  npm version patch
  ```

- **Minor** (`1.1.0`): New features, backward compatible
  ```bash
  npm version minor
  ```

- **Major** (`2.0.0`): Breaking changes
  ```bash
  npm version major
  ```

### Pre-release Versions

```bash
npm version prepatch --preid=alpha  # 1.0.1-alpha.0
npm version preminor --preid=beta   # 1.1.0-beta.0
npm version premajor --preid=rc     # 2.0.0-rc.0
```

## 7. Publishing Checklist

Before publishing:

- [ ] Remove `"private": true` from package.json
- [ ] Update version number
- [ ] Update CHANGELOG.md
- [ ] Run `bun run build`
- [ ] Run `bun test` (all tests pass)
- [ ] Run `npm pack --dry-run` to verify contents
- [ ] Verify package name availability
- [ ] Ensure npm login (`npm whoami`)
- [ ] Check .npmignore includes correct files
- [ ] Update README.md with npm installation instructions
- [ ] Tag release in git

## 8. Post-Publishing

### Verify Publication

```bash
# Check npm
npm view @patgpt/skynet-mcp

# Install to test
npm install -g @patgpt/skynet-mcp
skynet-mcp --version
```

### Update Documentation

Update README.md with npm installation:

```markdown
## Installation

### From npm

\`\`\`bash
npm install -g @patgpt/skynet-mcp
# or
bun add @patgpt/skynet-mcp
\`\`\`

### From Source

\`\`\`bash
git clone https://github.com/patgpt/patgpt-mcp.git
cd patgpt-mcp
bun install
bun run build
\`\`\`
```

## 9. Scoped vs Unscoped Packages

### Scoped (Recommended)
```
@patgpt/skynet-mcp
```
- Requires organization account
- Always public with free accounts
- Clearer ownership

### Unscoped
```
skynet-mcp
```
- No organization needed
- May conflict with existing packages
- Check availability first

## 10. Alternative: Private Registry

If you want to keep it private:

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

## 11. Deprecating/Unpublishing

### Deprecate a Version
```bash
npm deprecate @patgpt/skynet-mcp@1.0.0 "Please upgrade to 1.0.1"
```

### Unpublish (within 72 hours)
```bash
npm unpublish @patgpt/skynet-mcp@1.0.0
```

## Summary: Complete Publishing Flow

```bash
# 1. Prepare
npm login
git checkout main
git pull origin main

# 2. Update
vim package.json  # Update version, remove "private": true
vim CHANGELOG.md  # Document changes

# 3. Build & Test
bun install
bun run build
bun test

# 4. Verify
npm pack --dry-run

# 5. Publish
npm publish --access public

# 6. Tag & Push
git add package.json CHANGELOG.md
git commit -m "chore: release v1.0.0"
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# 7. Create GitHub Release
# (Triggers automatically via workflow)
```

## Common Issues

### "Package name already exists"
Change name in package.json or use scoped package (@patgpt/skynet-mcp)

### "You do not have permission to publish"
Ensure you're logged in: `npm whoami`
Check organization access if using scoped package

### "Package marked as private"
Remove `"private": true` from package.json

### "Missing required files"
Check `"files"` array in package.json includes dist/

## Resources

- [npm Documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [npm Package Scope](https://docs.npmjs.com/cli/v10/using-npm/scope)
