# Release Guide

This document describes how to create a new release of Skynet MCP Server.

## Release Process

### 1. Prepare the Release

Ensure all changes are committed and pushed to `main`:

```bash
# Check status
git status

# Ensure you're on main
git checkout main
git pull origin main

# Run tests and build
bun run release
```

### 2. Update Version

Update the version in `package.json`:

```json
{
  "version": "1.2.0"
}
```

Commit the version change:

```bash
git add package.json
git commit -m "chore: bump version to v1.2.0"
git push origin main
```

### 3. Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release v1.2.0"

# Push tag to trigger release workflow
git push origin v1.2.0
```

### 4. Monitor Release Workflow

The GitHub Actions workflow will:
1. Run all tests
2. Build the production bundle
3. Create a GitHub release with:
   - `skynet-mcp-v1.2.0.tar.gz` (full package)
   - `dist/index.js` (standalone bundle)
   - Auto-generated release notes

Check progress at: `https://github.com/patgpt/skynet/actions`

### 5. Verify Release

Visit the releases page to verify:
- Release notes are accurate
- Artifacts are attached
- Version tag is correct

## Manual Release (Workflow Dispatch)

You can also trigger a release manually:

1. Go to GitHub Actions → Release workflow
2. Click "Run workflow"
3. Enter version (e.g., `v1.2.0`)
4. Click "Run workflow"

## Version Naming

Follow [Semantic Versioning](https://semver.org/):

- **Major** (`v2.0.0`): Breaking changes
- **Minor** (`v1.1.0`): New features, backward compatible
- **Patch** (`v1.0.1`): Bug fixes, backward compatible

### Pre-release Versions

For pre-releases, use suffixes:

- **Alpha**: `v1.2.0-alpha.1` (early testing)
- **Beta**: `v1.2.0-beta.1` (feature complete, testing)
- **RC**: `v1.2.0-rc.1` (release candidate)

Pre-releases are automatically marked as "pre-release" on GitHub.

## Release Artifacts

Each release includes:

### 1. Tarball (`skynet-mcp-vX.Y.Z.tar.gz`)

Complete package with:
- `dist/` - Production build
- `package.json` - Dependencies
- `bun.lock` - Lock file
- `README.md` - Documentation
- `LICENSE` - License file
- `docker-compose.yml` - Database setup

### 2. Standalone Bundle (`dist/index.js`)

Minified production bundle (3.9 MB):
- All code bundled
- External dependencies excluded
- Ready to run with: `bun run dist/index.js`

## Installation from Release

### From Tarball

```bash
# Download
wget https://github.com/patgpt/skynet/releases/download/v1.0.0/skynet-mcp-v1.0.0.tar.gz

# Extract
tar -xzf skynet-mcp-v1.0.0.tar.gz
cd skynet-mcp-v1.0.0

# Install dependencies
bun install --production

# Start databases
docker-compose up -d

# Run
bun run dist/index.js
```

### From Standalone Bundle

```bash
# Download
wget https://github.com/patgpt/skynet/releases/download/v1.0.0/index.js

# Install external dependencies
bun add cohere-ai @google/generative-ai openai chromadb neo4j-driver dockerode

# Run
bun run index.js
```

## Rollback

To rollback to a previous version:

```bash
# Delete the tag locally
git tag -d v1.2.0

# Delete the tag remotely
git push origin :refs/tags/v1.2.0

# Delete the GitHub release manually
# Go to Releases → Edit → Delete release
```

## Hotfix Process

For urgent fixes:

1. Create a hotfix branch from the release tag:
   ```bash
   git checkout -b hotfix/v1.0.1 v1.0.0
   ```

2. Make the fix and commit:
   ```bash
   git commit -m "fix: critical bug"
   ```

3. Merge to main:
   ```bash
   git checkout main
   git merge hotfix/v1.0.1
   ```

4. Tag and release:
   ```bash
   git tag -a v1.0.1 -m "Hotfix v1.0.1"
   git push origin v1.0.1
   ```

## Troubleshooting

### "Release workflow failed"

Check the GitHub Actions logs:
1. Go to Actions tab
2. Click on the failed workflow
3. Review test/build logs

Common issues:
- Tests failing → Fix tests and re-tag
- Build errors → Check dependencies
- Permission denied → Verify `GITHUB_TOKEN` permissions

### "Tag already exists"

Delete and recreate:
```bash
git tag -d v1.2.0
git push origin :refs/tags/v1.2.0
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

### "Artifacts missing from release"

The workflow should automatically attach artifacts. If missing:
1. Re-run the workflow from GitHub Actions
2. Or manually upload artifacts to the release

## Checklist

Before creating a release:

- [ ] All tests passing (`bun test`)
- [ ] Type checks passing (`bun run typecheck`)
- [ ] Build successful (`bun run build`)
- [ ] Documentation updated
- [ ] CHANGELOG updated (if maintained)
- [ ] Version bumped in `package.json`
- [ ] Committed and pushed to `main`
- [ ] Tag created and pushed
- [ ] Release workflow completed
- [ ] Artifacts attached to release
- [ ] Release notes reviewed

## Next Steps

After release:
1. Announce release (if applicable)
2. Update documentation site (auto-deploys)
3. Monitor for issues
4. Plan next version
