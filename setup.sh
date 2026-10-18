#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}    EON BASE PROJECT SETUP SCRIPT     ${NC}"
echo -e "${BLUE}======================================${NC}"

# 1. Install NPM Dependencies
echo -e "\n${GREEN}[1/4] Installing Frontend Dependencies...${NC}"
npm install --legacy-peer-deps

# 2. Download and Setup PocketBase
echo -e "\n${GREEN}[2/4] Setting up PocketBase Backend...${NC}"
mkdir -p backend
cd backend

PB_VERSION="0.22.21" # Stable version
OS="linux"
ARCH="amd64"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="darwin"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

# Detect Architecture
if [[ $(uname -m) == "arm64" || $(uname -m) == "aarch64" ]]; then
    ARCH="arm64"
fi

ZIP_FILE="pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"

if [ ! -f "pocketbase" ] && [ ! -f "pocketbase.exe" ]; then
    echo "Downloading PocketBase v${PB_VERSION} for ${OS} ${ARCH}..."
    curl -L -o pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${ZIP_FILE}"
    unzip pb.zip
    rm pb.zip
    echo "PocketBase downloaded successfully."
else
    echo "PocketBase binary already exists. Skipping download."
fi
cd ..

# 3. Apply Schema (Optional Helper)
echo -e "\n${GREEN}[3/4] Database Configuration...${NC}"
echo "Please remember to import 'pb_schema.json' via the PocketBase Admin UI (Settings > Import/Export) once the server starts."

# 4. Start Servers
echo -e "\n${GREEN}[4/4] Starting Development Servers...${NC}"

# Start PocketBase in the background
echo "Starting PocketBase on http://127.0.0.1:8090"
if [[ "$OS" == "windows" ]]; then
    ./backend/pocketbase.exe serve &
else
    ./backend/pocketbase serve &
fi
PB_PID=$!

# Start Vite in the foreground
echo "Starting Vite Frontend on http://localhost:5173"
npm run dev

# Cleanup background processes on exit
trap "kill $PB_PID" EXIT
