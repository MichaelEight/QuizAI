#!/bin/bash

# Version Bump Script
# Usage: ./bump-version.sh -major | -minor | -patch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Get script directory and cd there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Parse arguments
BUMP_TYPE=""
case "$1" in
    -major|--major)
        BUMP_TYPE="major"
        ;;
    -minor|--minor)
        BUMP_TYPE="minor"
        ;;
    -patch|--patch)
        BUMP_TYPE="patch"
        ;;
    *)
        echo "Usage: $0 -major | -minor | -patch"
        echo ""
        echo "Options:"
        echo "  -major    Bump major version (X.0.0)"
        echo "  -minor    Bump minor version (x.Y.0)"
        echo "  -patch    Bump patch version (x.y.Z)"
        exit 1
        ;;
esac

info "Bump type: $BUMP_TYPE"

# Check for package.json
if [ ! -f "package.json" ]; then
    error "package.json not found in $SCRIPT_DIR"
fi

# Get current version from package.json
CURRENT_VERSION=$(grep -m1 '"version"' package.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
if [ -z "$CURRENT_VERSION" ]; then
    error "Could not read version from package.json"
fi

info "Current version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Validate version components are numbers
if ! [[ "$MAJOR" =~ ^[0-9]+$ ]] || ! [[ "$MINOR" =~ ^[0-9]+$ ]] || ! [[ "$PATCH" =~ ^[0-9]+$ ]]; then
    error "Invalid version format: $CURRENT_VERSION (expected X.Y.Z)"
fi

# Calculate new version
case "$BUMP_TYPE" in
    major)
        NEW_MAJOR=$((MAJOR + 1))
        NEW_VERSION="$NEW_MAJOR.0.0"
        ;;
    minor)
        NEW_MINOR=$((MINOR + 1))
        NEW_VERSION="$MAJOR.$NEW_MINOR.0"
        ;;
    patch)
        NEW_PATCH=$((PATCH + 1))
        NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
        ;;
esac

info "New version: $NEW_VERSION"

# Check for staged changes
STAGED=$(git diff --cached --name-only)
if [ -n "$STAGED" ]; then
    error "There are staged changes. Please commit or unstage them first:\n$STAGED"
fi

success "No staged changes found"

# Update package.json
info "Updating package.json..."
sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Verify package.json was updated
VERIFY_PKG=$(grep -m1 '"version"' package.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
if [ "$VERIFY_PKG" != "$NEW_VERSION" ]; then
    error "Failed to update package.json"
fi
success "package.json updated"

# Update package-lock.json (has version in 2 places)
if [ -f "package-lock.json" ]; then
    info "Updating package-lock.json..."

    # Update root version (first occurrence)
    sed -i '' "0,/\"version\": \"$CURRENT_VERSION\"/s//\"version\": \"$NEW_VERSION\"/" package-lock.json

    # Update packages[""] version (second occurrence in the packages section)
    sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/g" package-lock.json

    success "package-lock.json updated"
else
    warn "package-lock.json not found, skipping"
fi

# Stage the changes
info "Staging changes..."
git add package.json
if [ -f "package-lock.json" ]; then
    git add package-lock.json
fi
success "Changes staged"

# Commit
COMMIT_MSG="chore: Bump version to v$NEW_VERSION"
info "Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Create tag
TAG_NAME="v$NEW_VERSION"
info "Creating tag: $TAG_NAME"
git tag "$TAG_NAME"
success "Tag created"

echo ""
success "Version bumped from $CURRENT_VERSION to $NEW_VERSION"

# Ask to push (default yes)
read -p "$(echo -e "${BLUE}Push commit and tag to remote? (Y/n): ${NC}")" PUSH_CONFIRM
if [[ ! "$PUSH_CONFIRM" =~ ^[Nn]$ ]]; then
    info "Pushing to remote..."
    git push && git push origin "$TAG_NAME"
    success "Pushed commit and tag $TAG_NAME to remote"
else
    info "Skipped push. To push manually:"
    echo "  git push && git push origin $TAG_NAME"
fi
