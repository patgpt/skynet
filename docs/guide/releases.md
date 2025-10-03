# Quick Release Guide

## Create a Release

```bash
# Using helper script (recommended)
./scripts/create-release.sh v1.0.0 "Initial release"
git push origin main v1.0.0

# Manual
bun run release                           # Test + build
vim package.json                          # Update version
git commit -am "chore: bump v1.0.0"
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main v1.0.0
```

## Pre-release

```bash
./scripts/create-release.sh v1.0.0-alpha.1 "Alpha release"
git push origin main v1.0.0-alpha.1
```

## What Gets Released

- ✅ Tests pass
- ✅ Build succeeds (3.9MB)
- ✅ Tarball: `skynet-mcp-vX.Y.Z.tar.gz`
- ✅ Bundle: `dist/index.js`
- ✅ Auto-generated release notes
- ✅ Pre-release flag (if alpha/beta/rc)

## Install from Release

```bash
# Full package
wget https://github.com/patgpt/skynet/releases/latest/download/skynet-mcp-v1.0.0.tar.gz
tar -xzf skynet-mcp-v1.0.0.tar.gz
cd skynet-mcp-v1.0.0
bun install --production
docker-compose up -d
bun run dist/index.js

# Standalone
wget https://github.com/patgpt/skynet/releases/latest/download/index.js
bun add chromadb neo4j-driver dockerode cohere-ai @google/generative-ai openai
bun run index.js
```

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Run tests, type check, build |
| `release.yml` | Git tag `v*` | Create GitHub release |
| `docs.yml` | Push to main | Deploy documentation |

## Version Format

- `v1.0.0` - Stable release
- `v1.0.0-alpha.1` - Alpha (early testing)
- `v1.0.0-beta.1` - Beta (feature complete)
- `v1.0.0-rc.1` - Release candidate

## Rollback

```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
# Manually delete GitHub release
```

## Documentation

- Full guide: [RELEASE.md](https://github.com/patgpt/skynet/blob/main/RELEASE.md)
- Changelog: [CHANGELOG.md](https://github.com/patgpt/skynet/blob/main/CHANGELOG.md)
- Contributing: See README.md
