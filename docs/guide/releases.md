# Quick Release Guide

## Create a Release (CI-Only)

All releases are handled by GitHub Actions:

1. **Update version** in `package.json`
2. **Commit and push** to `main`
3. **Create GitHub release** with new tag (e.g., `v1.0.0`)
4. **CI automatically**:
   - Runs tests
   - Builds production bundle
   - Creates release artifacts
   - Publishes to npm and GitHub Packages

## Pre-release

For pre-releases, use version suffixes:
- `v1.0.0-alpha.1` - Alpha release
- `v1.0.0-beta.1` - Beta release  
- `v1.0.0-rc.1` - Release candidate

Mark as "pre-release" when creating the GitHub release.

## What Gets Released

- ✅ Tests pass
- ✅ Build succeeds (3.9MB)
- ✅ Tarball: `skynet-vX.Y.Z.tar.gz`
- ✅ Bundle: `dist/index.js`
- ✅ Published to npm
- ✅ Published to GitHub Packages
- ✅ Auto-generated release notes
- ✅ Pre-release flag (if alpha/beta/rc)

## Install from Release

```bash
# Full package
wget https://github.com/patgpt/skynet/releases/latest/download/skynet-v1.0.0.tar.gz
tar -xzf skynet-v1.0.0.tar.gz
cd skynet-v1.0.0
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
