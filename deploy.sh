#!/bin/bash

# QuizAI Deployment Script
# Runs checks, tests, builds, uploads to S3, and invalidates CloudFront cache

set -e  # Exit on any error

# ============================================
# CONFIGURATION (loaded from .env)
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
else
    echo "[ERROR] .env file not found. Copy .env.example to .env and fill in your values."
    exit 1
fi

S3_BUCKET="${AWS_S3_BUCKET}"
CLOUDFRONT_DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID}"
S3_PATH="${AWS_S3_PATH}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Validate required env vars
if [ -z "$S3_BUCKET" ] || [ "$S3_BUCKET" = "your-s3-bucket-name" ]; then
    echo "[ERROR] AWS_S3_BUCKET not configured in .env"
    exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ] || [ "$CLOUDFRONT_DISTRIBUTION_ID" = "your-cloudfront-distribution-id" ]; then
    echo "[ERROR] AWS_CLOUDFRONT_DISTRIBUTION_ID not configured in .env"
    exit 1
fi
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print colored status messages
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}${BOLD}=== STEP $1: $2 ===${NC}"; }

cd "$SCRIPT_DIR"

echo -e "${BOLD}"
echo "╔════════════════════════════════════════╗"
echo "║       QuizAI Deployment Script         ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
info "Working directory: $SCRIPT_DIR"
info "Target: s3://$S3_BUCKET/$S3_PATH/"
info "CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""

# ============================================
# STEP 1: Check AWS CLI and credentials
# ============================================
step "1" "Checking AWS CLI and credentials"

if ! command -v aws &> /dev/null; then
    error "AWS CLI is not installed. Please install it first."
fi
info "AWS CLI found: $(which aws)"

info "Verifying AWS credentials..."
if ! AWS_IDENTITY=$(aws sts get-caller-identity 2>&1); then
    error "AWS credentials not configured. Run 'aws configure' first.\nDetails: $AWS_IDENTITY"
fi
AWS_ACCOUNT=$(echo "$AWS_IDENTITY" | grep -o '"Account": "[^"]*"' | cut -d'"' -f4)
info "AWS Account: $AWS_ACCOUNT"
success "AWS credentials valid"

# ============================================
# STEP 2: Check for uncommitted changes
# ============================================
step "2" "Checking Git status"

if ! command -v git &> /dev/null; then
    warn "Git not found, skipping git checks"
else
    if [ ! -d ".git" ]; then
        warn "Not a git repository, skipping git checks"
    else
        info "Checking for uncommitted changes..."

        UNCOMMITTED=$(git status --porcelain)
        if [ -n "$UNCOMMITTED" ]; then
            warn "You have uncommitted changes:"
            echo ""
            git status --short
            echo ""
            read -p "$(echo -e "${YELLOW}Do you want to continue anyway? (y/N): ${NC}")" CONTINUE
            if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
                error "Deployment aborted. Please commit your changes first."
            fi
            warn "Continuing with uncommitted changes..."
        else
            success "Working directory is clean"
        fi
    fi
fi

# ============================================
# STEP 3: Check for version tag
# ============================================
step "3" "Checking version tag"

if command -v git &> /dev/null && [ -d ".git" ]; then
    CURRENT_COMMIT=$(git rev-parse HEAD)
    CURRENT_COMMIT_SHORT=$(git rev-parse --short HEAD)
    info "Current commit: $CURRENT_COMMIT_SHORT"

    # Get tags pointing to current commit that match vX.Y.Z pattern
    VERSION_TAG=$(git tag --points-at HEAD | grep -E "^v[0-9]+\.[0-9]+\.[0-9]+$" | head -1)

    if [ -z "$VERSION_TAG" ]; then
        warn "Current commit is NOT tagged with a version (vX.Y.Z format)"

        # Show latest version tag for reference
        LATEST_TAG=$(git tag -l "v*.*.*" --sort=-v:refname | head -1)
        if [ -n "$LATEST_TAG" ]; then
            info "Latest version tag: $LATEST_TAG"
        fi

        read -p "$(echo -e "${YELLOW}Do you want to continue without a version tag? (y/N): ${NC}")" CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            echo ""
            info "To create a version tag, run:"
            echo "  git tag v1.X.X"
            echo "  git push origin v1.X.X"
            error "Deployment aborted. Please tag your commit first."
        fi
        warn "Continuing without version tag..."
    else
        success "Version tag found: $VERSION_TAG"
    fi
else
    warn "Git not available, skipping version tag check"
fi

# ============================================
# STEP 4: Run linter
# ============================================
step "4" "Running linter"

info "Executing: npm run lint"
if npm run lint; then
    success "Linting passed - no errors"
else
    error "Linting failed. Please fix the errors above before deploying."
fi

# ============================================
# STEP 5: Run tests
# ============================================
step "5" "Running tests"

info "Executing: npm run test:run"
if npm run test:run; then
    success "All tests passed"
else
    error "Tests failed. Please fix the failing tests before deploying."
fi

# ============================================
# STEP 6: Build application
# ============================================
step "6" "Building application"

info "Executing: npm run build"
if npm run build; then
    # Count files in dist
    FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')
    DIST_SIZE=$(du -sh dist | cut -f1)
    info "Build output: $FILE_COUNT files, $DIST_SIZE total"
    success "Build completed successfully"
else
    error "Build failed. Check the errors above."
fi

# ============================================
# STEP 7: Upload to S3
# ============================================
step "7" "Uploading to S3"

info "Syncing dist/ to s3://$S3_BUCKET/$S3_PATH/"
info "Executing: aws s3 sync dist/ s3://$S3_BUCKET/$S3_PATH/ --delete --region $AWS_REGION"

if aws s3 sync dist/ "s3://$S3_BUCKET/$S3_PATH/" --delete --region "$AWS_REGION"; then
    success "Upload completed successfully"
else
    error "S3 upload failed. Check your permissions and bucket configuration."
fi

# ============================================
# STEP 8: Invalidate CloudFront cache
# ============================================
step "8" "Invalidating CloudFront cache"

info "Creating invalidation for /$S3_PATH/*"
info "Executing: aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths /$S3_PATH/*"

INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/$S3_PATH/*" 2>&1)

if [ $? -eq 0 ]; then
    INVALIDATION_ID=$(echo "$INVALIDATION_OUTPUT" | grep -o '"Id": "[^"]*"' | head -1 | cut -d'"' -f4)
    info "Invalidation ID: $INVALIDATION_ID"
    success "CloudFront invalidation created"
else
    warn "CloudFront invalidation may have failed: $INVALIDATION_OUTPUT"
fi

# ============================================
# DEPLOYMENT COMPLETE
# ============================================
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔════════════════════════════════════════╗"
echo "║       DEPLOYMENT SUCCESSFUL!           ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
info "Site URL: https://app.michaeleight.com/quizai/"
info "S3 Location: s3://$S3_BUCKET/$S3_PATH/"
if [ -n "$VERSION_TAG" ]; then
    info "Version: $VERSION_TAG"
fi
info "CloudFront invalidation may take 5-10 minutes to propagate globally"
echo ""
