#!/usr/bin/env bash
# ==============================================================================
# AgriSlot - Sync Workspace to Development Directory
# Source: /Users/gouravgodara/Documents/dbms project
# Target: /Users/gouravgodara/Development/Agrislot
# ==============================================================================

set -e

SRC_DIR="/Users/gouravgodara/Documents/dbms project"
DEST_DIR="/Users/gouravgodara/Development/Agrislot"

echo "Syncing AgriSlot from '$SRC_DIR' to '$DEST_DIR'..."

mkdir -p "$DEST_DIR"

# 1. Sync Frontend
rsync -av --delete --exclude 'node_modules' --exclude '.next' "$SRC_DIR/frontend/" "$DEST_DIR/frontend/"

# 2. Sync Backend
rsync -av --exclude 'node_modules' "$SRC_DIR/backend/" "$DEST_DIR/backend/"
rsync -av --exclude 'node_modules' "$SRC_DIR/src/" "$DEST_DIR/src/"

# 3. Sync Scripts, Docs, Database, Tests
rsync -av --exclude 'node_modules' "$SRC_DIR/scripts/" "$DEST_DIR/scripts/"
rsync -av --exclude 'node_modules' "$SRC_DIR/docs/" "$DEST_DIR/docs/"
rsync -av "$SRC_DIR/database/" "$DEST_DIR/database/"
rsync -av "$SRC_DIR/tests/" "$DEST_DIR/tests/"
rsync -av "$SRC_DIR/tests/" "$DEST_DIR/backend/tests/"

# 4. Sync Root Configuration & Launcher
cp "$SRC_DIR/package.json" "$DEST_DIR/package.json"
[ -f "$SRC_DIR/package-lock.json" ] && cp "$SRC_DIR/package-lock.json" "$DEST_DIR/package-lock.json"
[ -f "$SRC_DIR/.env" ] && cp "$SRC_DIR/.env" "$DEST_DIR/.env" && cp "$SRC_DIR/.env" "$DEST_DIR/backend/.env"
cp "$SRC_DIR/README.md" "$DEST_DIR/README.md"
cp "$SRC_DIR/start_agrislot.sh" "$DEST_DIR/start_agrislot.sh"
chmod +x "$DEST_DIR/start_agrislot.sh"

# 5. Ensure dependencies and module resolution
if [ -d "$SRC_DIR/node_modules/google-auth-library" ] && [ -d "$DEST_DIR/backend/node_modules" ]; then
  cp -r "$SRC_DIR/node_modules/google-auth-library" "$DEST_DIR/backend/node_modules/" 2>/dev/null || true
fi
if [ ! -e "$DEST_DIR/node_modules" ] && [ -d "$DEST_DIR/backend/node_modules" ]; then
  echo "Linking backend/node_modules to root node_modules in Agrislot..."
  ln -sfn "$DEST_DIR/backend/node_modules" "$DEST_DIR/node_modules"
fi

echo "✓ Synchronization completed successfully!"
