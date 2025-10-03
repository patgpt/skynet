#!/bin/bash

# NPM Publish Helper Script
# Prepares and publishes the package to npm

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║              NPM PUBLISH PREPARATION                               ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if logged in to npm
echo "🔐 Checking npm authentication..."
if ! npm whoami &> /dev/null; then
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
echo "✅ Logged in as: $NPM_USER"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"
echo ""

# Ask for version bump
echo "Select version bump type:"
echo "  1) patch  (${CURRENT_VERSION} → $(npm version patch --no-git-tag-version --dry-run 2>/dev/null | grep -o 'v[0-9.]*' | sed 's/v//'))"
echo "  2) minor  (${CURRENT_VERSION} → $(npm version minor --no-git-tag-version --dry-run 2>/dev/null | grep -o 'v[0-9.]*' | sed 's/v//'))"
echo "  3) major  (${CURRENT_VERSION} → $(npm version major --no-git-tag-version --dry-run 2>/dev/null | grep -o 'v[0-9.]*' | sed 's/v//'))"
echo "  4) custom"
echo "  5) skip (keep current version)"
echo ""

read -p "Choice [1-5]: " VERSION_CHOICE

case $VERSION_CHOICE in
    1)
        NEW_VERSION=$(npm version patch --no-git-tag-version | sed 's/v//')
        ;;
    2)
        NEW_VERSION=$(npm version minor --no-git-tag-version | sed 's/v//')
        ;;
    3)
        NEW_VERSION=$(npm version major --no-git-tag-version | sed 's/v//')
        ;;
    4)
        read -p "Enter version (e.g., 1.2.3): " CUSTOM_VERSION
        npm version $CUSTOM_VERSION --no-git-tag-version
        NEW_VERSION=$CUSTOM_VERSION
        ;;
    5)
        NEW_VERSION=$CURRENT_VERSION
        echo "Keeping version: $NEW_VERSION"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📝 Version: $NEW_VERSION"
echo ""

# Update CHANGELOG
echo "📚 Remember to update CHANGELOG.md!"
read -p "Press Enter when CHANGELOG.md is updated..."

# Run tests
echo ""
echo "🧪 Running tests..."
if ! bun test; then
    echo "❌ Tests failed. Fix tests before publishing."
    exit 1
fi
echo "✅ Tests passed"
echo ""

# Type check
echo "🔍 Type checking..."
if ! bun run typecheck; then
    echo "❌ Type check failed. Fix type errors before publishing."
    exit 1
fi
echo "✅ Type check passed"
echo ""

# Build
echo "📦 Building..."
if ! bun run build:all; then
    echo "❌ Build failed."
    exit 1
fi
echo "✅ Build succeeded"
echo ""

# Verify package contents
echo "📋 Package contents:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm pack --dry-run 2>&1 | grep -E "^npm notice|^package:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Confirm publish
read -p "🚀 Publish @patgpt/skynet@${NEW_VERSION} to npm? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publish cancelled"
    exit 1
fi

# Publish
echo ""
echo "📤 Publishing to npm..."
if npm publish --access public; then
    echo ""
    echo "✅ Successfully published @patgpt/skynet@${NEW_VERSION}"
    echo ""
    echo "Next steps:"
    echo "  1. Commit version change: git commit -am \"chore: release v${NEW_VERSION}\""
    echo "  2. Create tag: git tag -a v${NEW_VERSION} -m \"Release v${NEW_VERSION}\""
    echo "  3. Push: git push origin main --tags"
    echo ""
    echo "📦 View on npm: https://www.npmjs.com/package/@patgpt/skynet"
else
    echo "❌ Publish failed"
    exit 1
fi
