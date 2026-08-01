#!/bin/bash

# Builds two branches side by side into esm_branch1/ and esm_branch2/ so
# `pnpm benchonly` can compare them. Uses git worktrees rather than switching
# branches, so the checkout is left untouched.

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git branch --show-current)
BRANCH1="${1:-main}"
BRANCH2="${2:-$CURRENT_BRANCH}"

TMP_DIR=$(mktemp -d)
trap 'git worktree remove --force "$TMP_DIR/b1" 2>/dev/null; git worktree remove --force "$TMP_DIR/b2" 2>/dev/null; rm -rf "$TMP_DIR"' EXIT

build_branch() {
  local branch=$1 worktree=$2 out=$3
  echo "Building $branch..."
  git worktree add --detach "$worktree" "$branch" >/dev/null
  (cd "$worktree" && pnpm install --frozen-lockfile && pnpm build:esm)
  rm -rf "${REPO_ROOT:?}/$out"
  mv "$worktree/esm" "$REPO_ROOT/$out"
  echo "$branch" >"$REPO_ROOT/$out/branchname.txt"
}

build_branch "$BRANCH1" "$TMP_DIR/b1" esm_branch1
build_branch "$BRANCH2" "$TMP_DIR/b2" esm_branch2

echo "Build complete!"
echo "$BRANCH1 build: esm_branch1/index.js"
echo "$BRANCH2 build: esm_branch2/index.js"
