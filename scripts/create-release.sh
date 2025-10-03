#!/bin/bash

# Release Helper Script
# Usage: ./scripts/create-release.sh v1.2.0 "Release message"

set -e

VERSION=$1
MESSAGE=${2:-"Release $VERSION"}

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/create-release.sh <version> [message]"
    echo "Example: ./scripts/create-release.sh v1.0.0 'Initial release'"
    exit 1
fi

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?$ ]]; then
    echo "Error: Invalid version format. Expected: v1.2.3 or v1.2.3-alpha.1"
    exit 1
fi

echo "🚀 Preparing release $VERSION"
echo ""

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: You are on branch '$CURRENT_BRANCH', not 'main'"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: You have uncommitted changes"
    git status -s
    exit 1
fi

# Run tests and build
echo "🧪 Running tests..."
bun test || { echo "❌ Tests failed"; exit 1; }

echo "🔍 Type checking..."
bun run typecheck || { echo "❌ Type check failed"; exit 1; }

echo "📦 Building..."
bun run build || { echo "❌ Build failed"; exit 1; }

# Update version in package.json
echo "📝 Updating package.json version..."
VERSION_NUMBER=${VERSION#v}
cat package.json | jq ".version = \"$VERSION_NUMBER\"" > package.json.tmp
mv package.json.tmp package.json

# Commit version change
git add package.json
git commit -m "chore: bump version to $VERSION" || true

# Create tag
echo "🏷️  Creating tag $VERSION..."
git tag -a "$VERSION" -m "$MESSAGE"

# Show what will be pushed
echo ""
echo "✅ Release prepared successfully!"
echo ""
echo "To complete the release, run:"
echo "  git push origin main"
echo "  git push origin $VERSION"
echo ""
echo "Or to cancel:"
echo "  git tag -d $VERSION"
echo "  git reset --hard HEAD~1"
