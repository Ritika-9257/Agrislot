#!/usr/bin/env bash
# ==============================================================================
# AgriSlot - All-in-One Service Launcher
# Starts Backend (Port 5001) & Frontend (Port 3000) with Graceful Shutdown
# ==============================================================================

set -e

# Resolve directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ANSI Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${GREEN}${BOLD}"
echo "======================================================================"
echo "    AgriSlot APMC Mandi Slot Booking & Logistics Platform"
echo "    All-in-One Full Stack Launcher"
echo "======================================================================"
echo -e "${NC}"

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Node.js is not installed or not in PATH.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${CYAN}[1/5] Detected Node.js: ${BOLD}${NODE_VERSION}${NC}"

# Ensure root node_modules is linked to backend/node_modules if present
if [ ! -e "$SCRIPT_DIR/node_modules" ] && [ -d "$SCRIPT_DIR/backend/node_modules" ]; then
  ln -sfn "$SCRIPT_DIR/backend/node_modules" "$SCRIPT_DIR/node_modules"
fi

# Check MySQL on Port 3306
echo -e "${CYAN}[2/5] Checking MySQL Service (127.0.0.1:3306)...${NC}"
if nc -z 127.0.0.1 3306 2>/dev/null || (echo > /dev/tcp/127.0.0.1/3306) 2>/dev/null; then
  echo -e "${GREEN}      ✓ MySQL is listening on port 3306.${NC}"
else
  echo -e "${YELLOW}      ⚠ MySQL does not appear to be listening on 127.0.0.1:3306.${NC}"
  echo -e "${YELLOW}        Please ensure your MySQL server is running (e.g., brew services start mysql).${NC}"
fi

# Run System Verification Audit & JSX Integrity Check
if [ -f "$SCRIPT_DIR/scripts/verify_system.js" ]; then
  echo -e "${CYAN}[3/5] Running Pre-Flight Health Audit...${NC}"
  node "$SCRIPT_DIR/scripts/verify_system.js" || {
    echo -e "${YELLOW}      ⚠ Verification reported warnings, continuing startup...${NC}"
  }
fi

if [ -f "$SCRIPT_DIR/scripts/check_jsx.js" ]; then
  node "$SCRIPT_DIR/scripts/check_jsx.js" || {
    echo -e "${YELLOW}      ⚠ JSX tag integrity check reported warnings.${NC}"
  }
fi

# Clean up stale processes on 5001 and 3000 if needed
clean_port() {
  local PORT=$1
  local PID=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo -e "${YELLOW}      Found existing process on port $PORT (PID $PID). Reclaiming port...${NC}"
    kill -9 $PID 2>/dev/null || true
    sleep 1
  fi
}

echo -e "${CYAN}[4/5] Preparing Ports...${NC}"
clean_port 5001
clean_port 3000

# Cleanup trap on EXIT or CTRL+C
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo -e "\n${YELLOW}[SHUTDOWN] Stopping AgriSlot background processes...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    echo -e "           Stopped Backend (PID $BACKEND_PID)"
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    echo -e "           Stopped Frontend (PID $FRONTEND_PID)"
  fi
  clean_port 5001
  clean_port 3000
  echo -e "${GREEN}[SHUTDOWN] All AgriSlot services terminated cleanly.${NC}"
  exit 0
}

trap cleanup INT TERM EXIT

# Start Backend Server on Port 5001
echo -e "${CYAN}[5/5] Launching Services...${NC}"
echo -e "${GREEN}      Starting Backend API on http://127.0.0.1:5001...${NC}"

if [ -d "$SCRIPT_DIR/backend" ]; then
  cd "$SCRIPT_DIR/backend"
  npm start > "$SCRIPT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  cd "$SCRIPT_DIR"
else
  npm start > "$SCRIPT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
fi

# Wait for backend to respond
echo -n "      Waiting for Backend API readiness..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:5001/api/health >/dev/null 2>&1 || nc -z 127.0.0.1 5001 2>/dev/null; then
    echo -e " ${GREEN}✓ ONLINE${NC}"
    break
  fi
  sleep 1
  echo -n "."
done

# Start Frontend Server on Port 3000
if [ -d "$SCRIPT_DIR/frontend" ]; then
  echo -e "${GREEN}      Starting Next.js Frontend on http://localhost:3000...${NC}"
  cd "$SCRIPT_DIR/frontend"
  
  # Check if frontend node_modules exists
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}      Installing frontend dependencies (first-time run)...${NC}"
    npm install
  fi

  npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  cd "$SCRIPT_DIR"

  # Wait for frontend to respond
  echo -n "      Waiting for Frontend server readiness..."
  for i in {1..20}; do
    if curl -s http://127.0.0.1:3000 >/dev/null 2>&1 || nc -z 127.0.0.1 3000 2>/dev/null; then
      echo -e " ${GREEN}✓ ONLINE${NC}"
      break
    fi
    sleep 1
    echo -n "."
  done
fi

echo -e "${GREEN}${BOLD}"
echo "======================================================================"
echo "  ✓ AgriSlot Full Stack is Ready and Running!"
echo "======================================================================"
echo -e "${NC}"
echo -e "${CYAN}Available Interfaces:${NC}"
echo -e "  • ${BOLD}Fast-Track Inbound Clearance Rig (Home):${NC}  http://localhost:3000"
echo -e "  • ${BOLD}Farmer Booking Portal & Gate Pass:${NC}        http://localhost:3000/farmer"
echo -e "  • ${BOLD}Gate 02 Verification Terminal:${NC}             http://localhost:3000/verify"
echo -e "  • ${BOLD}Mandi Officer Administrative Desk:${NC}         http://localhost:3000/admin"
echo -e "  • ${BOLD}Concurrency Lab & SQL Telemetry:${NC}           http://localhost:3000/analytics"
echo -e "  • ${BOLD}Backend REST API Health:${NC}                   http://127.0.0.1:5001/api/health"
echo ""
echo -e "Logs are streaming to ${BOLD}backend.log${NC} and ${BOLD}frontend.log${NC}."
echo -e "${YELLOW}Press [CTRL+C] at any time to gracefully terminate both services.${NC}"

# Open browser on macOS if available
if command -v open >/dev/null 2>&1; then
  sleep 1
  open "http://localhost:3000" 2>/dev/null || true
fi

# Keep script running and wait for children
wait $BACKEND_PID $FRONTEND_PID
