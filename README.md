# Eon Base Project 🌍

> *Democratise Higher Scientific Education Through A Non-Profit, Globally Driven Network*

Eon is a gamified, AI-powered Progressive Web App (PWA) designed for field science (geology, paleontology, mineralogy). It allows curious explorers to capture, identify, and catalog their findings in the wild using on-device AI, and seamlessly syncs that data to a secure backend when an internet connection is restored.

---

## 🏗️ Architecture Overview

Eon is built using a **Local-First, Optimistic-Replication** architecture designed to survive harsh field conditions without cellular reception.

* **Frontend:** React 19, Vite, Tailwind CSS v4, shadcn/ui.
* **Local Storage:** Dexie.js (IndexedDB) for offline DRAFT findings.
* **Backend:** PocketBase (SQLite) hosted on Oracle Cloud for maximum free block storage.
* **Map & Geospatial:** React-Leaflet with Hexagonal Grid Location Fuzzing (to protect fragile field sites from poaching).
* **AI Edge Inference:** `onnxruntime-web` running MobileNetV2 locally via a Web Worker.
* **AI Chatbot:** "Master Geologist" LLM mentoring powered by OpenAI / PocketBase custom routes.

*For full design specifications, schema definitions, and sequence diagrams, please read the [ARCHITECTURE.md](./ARCHITECTURE.md).*

---

## 🚀 Quick Start (Automated Setup)

We have provided a unified setup script that will automatically install frontend dependencies, download the correct PocketBase binary for your operating system, and launch both the frontend and backend development servers.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* Git

### Run the script:

```bash
# Make the script executable
chmod +x setup.sh

# Run the automated setup
./setup.sh
```

* **Frontend** will be available at: `http://localhost:5173`
* **PocketBase Admin UI** will be available at: `http://127.0.0.1:8090/_/`

---

## 🛠️ Manual Installation

If you prefer to set up the environments manually:

### 1. Setup the Backend (PocketBase)
1. Download the latest PocketBase binary for your OS from [PocketBase Releases](https://github.com/pocketbase/pocketbase/releases).
2. Extract the binary into a `backend/` folder.
3. Apply the schema provided in `pb_schema.json` via the PocketBase Admin UI (Settings > Import/Export).
4. Start the server:
   ```bash
   ./pocketbase serve
   ```

### 2. Setup the Frontend (Vite/React)
1. Install the dependencies (using legacy peer deps for React 19 compatibility):
   ```bash
   npm install --legacy-peer-deps
   ```
2. Create a `.env` file in the root directory (Optional: if testing AI Chatbot locally):
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

This project uses Vitest and React Testing Library for unit and integration testing.

```bash
# Run the test suite
npm run test
```

## 🤝 Contributing
We are looking for developers, software architects, and UI/UX designers who want to be technological founders of a non-profit educational movement.

Decentralized Educational Ecosystem · Eon-Base Project · Free, Non-Profit Heritage.
