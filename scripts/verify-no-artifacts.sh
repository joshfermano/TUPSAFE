#!/bin/bash
# Script to verify no build artifacts are tracked in git
# Run this in CI/CD to prevent accidental commits of build outputs

set -e

echo "🔍 Checking for tracked build artifacts..."

# Check for dist directories
DIST_FILES=$(git ls-files | grep -E "packages/.*/dist/" || true)
if [ -n "$DIST_FILES" ]; then
  echo "❌ ERROR: Found tracked dist files:"
  echo "$DIST_FILES"
  exit 1
fi

# Check for node_modules
NODE_MODULES=$(git ls-files | grep "node_modules/" || true)
if [ -n "$NODE_MODULES" ]; then
  echo "❌ ERROR: Found tracked node_modules files:"
  echo "$NODE_MODULES"
  exit 1
fi

# Check for .next directories
NEXT_DIRS=$(git ls-files | grep "\.next/" || true)
if [ -n "$NEXT_DIRS" ]; then
  echo "❌ ERROR: Found tracked .next files:"
  echo "$NEXT_DIRS"
  exit 1
fi

# Check for tsbuildinfo
TSBUILDINFO=$(git ls-files | grep "\.tsbuildinfo$" || true)
if [ -n "$TSBUILDINFO" ]; then
  echo "❌ ERROR: Found tracked tsbuildinfo files:"
  echo "$TSBUILDINFO"
  exit 1
fi

echo "✅ No build artifacts found in git tracking"
echo "✅ All checks passed!"
