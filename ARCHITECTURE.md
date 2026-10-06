# Eon Base Project: Technical Architecture and Design Specifications

## 1. Proposed System Architecture

The Eon platform adopts a modern, scalable, and modular client-server architecture, initially developed as a mobile-first web application with a clear trajectory toward a native Android application optimized for Qualcomm Snapdragon hardware. Remote field discovery requires a **Local-First, Optimistic-Replication** pattern. The application treats local device storage as the primary source of truth during field operations, treating PocketBase as a background replication target.

### High-Level Components

*   **Client / Frontend (Mobile-First Web & Future Native App)**
    *   **Core Framework:** React 18 with Vite, TypeScript.
    *   **Styling & UI:** TailwindCSS, shadcn/ui, Framer Motion for gamified animations.
    *   **Mapping Interface:** Interactive social and geological map integration (e.g., Leaflet or Mapbox) with offline vector tile packaging (MBTiles).
    *   **Local Storage Layer:** Offline-first sync layer using **RxDB** or **WatermelonDB** on top of SQLite/IndexedDB, featuring an Offline Mutation Queue.
    *   **Device APIs (Hardware Access):**
        *   **Camera/ISP:** High-resolution image capture for finding identification.
        *   **Sensors:** GPS, compass, and real-time geospatial data tracking.
        *   **Audio/Microphone:** Voice input for real-time AI consultations.
    *   **On-Device Processing:** Local inference for the AI Assistant and computer vision tasks (ONNX Runtime Web initially, migrating to Qualcomm NPU SDK natively) to reduce latency and enable offline field use.

*   **Backend Services (PocketBase on Oracle Cloud)**
    *   **Database (SQLite):** Lightweight, self-hosted relational data storage for user profiles, finding metadata, and community map points. Maximum free storage limits via Oracle Cloud VMs.
    *   **Authentication:** Built-in role-based access control managed via PocketBase collections (Standard Scouts vs. Level 5 Accredited Experts).
    *   **Storage:** Direct block storage for the Private Digital Gallery.

*   **AI Engine & Processing**
    *   **Conversational & Scientific Guide:** Large Language Model (LLM) fine-tuned with a "Master Geologist/Paleontologist" prompt.
    *   **Computer Vision:** Image recognition models for mineral and fossil identification.

*   **Specialized Modules**
    *   **Capture Buffer:** Rapid Photo Buffer / Burst Capture or short manual clips for the PWA MVP, evolving into a native hardware-accelerated continuous loop recording buffer.
    *   **Learning Progression Engine:** An invisible backend tracking system that monitors user interactions to progress them through Levels 1-4 and prepare them for Level 5 accreditation.

---

## 2. Infrastructure Diagram

### Core Sync & Client-Server Architecture

```mermaid
graph TD
    subgraph Client [Client Device Mobile/Web]
        UI[UI / Media Capture]
        LocalDB[(RxDB / Local DB)]
        Queue[Offline Mutation Queue]
        SyncEngine[Network Sync Engine & TUS]

        subgraph Hardware [Device Hardware]
            Cam[Camera / ISP]
            GPS[Geolocation / Sensors]
            NPU[On-Device AI - ONNX/Snapdragon]
        end
    end

    subgraph Backend [Backend Services PocketBase]
        Auth[Authentication]
        DB[(SQLite Database)]
        Storage[Oracle Cloud Block Storage]
    end

    %% Client Interactions
    UI -->|Writes Local| LocalDB
    LocalDB -->|Read Stream| UI
    LocalDB --> Queue
    Queue --> SyncEngine
    UI --> Cam
    UI --> GPS
    Cam --> NPU
    NPU --> UI

    %% Client to Backend
    SyncEngine -->|REST API| DB
    SyncEngine -->|Multipart Form Upload| Storage
```

### Hardware & AI Pipeline Optimization

```text
                  ┌──────────────────────────────────────────────────┐
                  │                 Field User Input                 │
                  └────────────────────────┬─────────────────────────┘
                                           │
                                           ▼
                  ┌──────────────────────────────────────────────────┐
                  │            Network Connection Check              │
                  └───────┬──────────────────────────────────┬───────┘
                          │                                  │
                   [Online]                               [Offline]
                          │                                  │
                          ▼                                  ▼
   ┌──────────────────────────────────────────────┐ ┌──────────────────────────────────┐
   │ Cloud Pipeline                               │ │ Local Pipeline                   │
   │ • High-Res Image Upload                      │ │ • Light On-Device Quantized Model│
   │ • Vision Transformer (ViT) Classification    │ │   (MobileNet / ONNX Web Runtime) │
   │ • Multimodal LLM (GPT-4o/Claude) via Backend │ │ • Heuristic Rule Engine          │
   └──────────────────────┬───────────────────────┘ └────────────────┬─────────────────┘
                          │                                  │
                          └──────────────────┬───────────────┘
                                             │
                                             ▼
                  ┌──────────────────────────────────────────────────┐
                  │ Structured JSON Response (Facts, Age, Taxonomy)  │
                  └──────────────────────────────────────────────────┘
```

---

## 3. User Workflow

The user journey is split into three main contexts: Field (Active Discovery), Home (Management & Community), and Education (Mentoring & Progression).

### Workflow A: The Field Discovery (Active Use - Offline First)
1.  **Preparation:** User opens the app and accesses the **Interactive Map**. Offline MBTiles have been pre-cached for the target expedition area.
2.  **Exploration & Capture:** User finds an interesting mineral or fossil. In the MVP PWA, they use the **Rapid Photo Buffer / Short Manual Clip** feature to capture the discovery.
3.  **Local AI Consultation:**
    *   User queries the AI Assistant.
    *   If offline, the **Local Pipeline (ONNX Web Runtime)** provides immediate visual classification (e.g., distinguishing quartz from calcite).
4.  **Geolocation & Storage:** The app tags the finding with GPS coordinates and stores the data and media locally in **RxDB / IndexedDB**. A mutation task is added to the **Offline Mutation Queue**.
5.  **Background Sync:** Once network connectivity is restored, the **Sync Engine** initiates multipart form uploads for media and syncs the metadata to PocketBase.

### Workflow B: Post-Expedition & Management (Home Use)
1.  **Cataloging:** User reviews their Private Digital Gallery, organizing high-value pieces. The PocketBase SQLite database fuzzes public location data to prevent looting while keeping exact coordinates secure.
2.  **Community Interaction:** User accesses the social map to discuss findings with other explorers.
3.  **Mentorship:** A Level 5 Expert reviews a public finding, validates the identification, and provides feedback.

### Workflow C: Institutional Collaboration
1.  **Donation:** User donates a significant piece to an allied museum.
2.  **Integration & Immortalization:** The museum displays the physical piece with a generated QR code linking to the user's original Eon platform discovery clip.

---

## 4. Detailed Design Specifications

### A. Data Schema & SQLite Security Enhancements

To prevent poaching risks (e.g., revealing exact coordinates of fragile fossil beds), the database employs SQLite triggers (or application-level logic in PocketBase hooks) for spatial data manipulation and location fuzzing.

```sql
-- Schema Refinement: Separate exact field location from public spatial data
CREATE TABLE findings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ai_classification TEXT DEFAULT '{}',

    -- Exact location (Restricted to owner & accredited Level 5 experts via PocketBase Rules)
    exact_lat REAL NOT NULL,
    exact_lng REAL NOT NULL,

    -- Public blurred location (Generalized spatial point/polygon for public feed)
    public_fuzzed_lat REAL,
    public_fuzzed_lng REAL,

    is_public BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically fuzz coordinates for public consumption (e.g., ~2km offset)
CREATE TRIGGER trg_fuzz_location_insert
AFTER INSERT ON findings
BEGIN
    UPDATE findings
    SET public_fuzzed_lat = NEW.exact_lat + (abs(random() % 2000) / 100000.0) - 0.01,
        public_fuzzed_lng = NEW.exact_lng + (abs(random() % 2000) / 100000.0) - 0.01
    WHERE id = NEW.id;
END;
```
*   **API Rules (PocketBase):** Standard users can only select the fuzzed coordinates of other users' findings, while Level 5 experts or the resource owner can query the exact lat/lng columns.

### B. Local-First Sync Data Models

To prevent upload failures over spotty connections, metadata and media binaries are decoupled.

```typescript
// Local RxDB/WatermelonDB Schema

interface LocalFinding {
  id: string;                      // Client-side generated UUIDv4
  user_id: string;
  title: string;
  notes: string;
  exact_location: {               // WGS 84 Point
    latitude: number;
    longitude: number;
    accuracy_meters: number;
    altitude: number | null;
  };
  ai_classification_draft?: Record<string, any>;
  media_ids: string[];             // Foreign keys to LocalMedia table
  sync_state: 'DRAFT' | 'QUEUED' | 'SYNCING' | 'SYNCED' | 'ERROR';
  sync_error?: string;
  created_at: string;             // ISO 8601 UTC timestamp
  updated_at: string;
}

interface LocalMedia {
  id: string;                      // UUIDv4
  finding_id: string;              // Belongs to LocalFinding
  file_type: 'IMAGE' | 'VIDEO_CLIP';
  local_uri: string;               // blob:// URL or native file system path
  mime_type: string;
  byte_size: number;
  remote_storage_path?: string;
  upload_progress: number;
  upload_offset_bytes: number;     // Resumable upload tracker (TUS protocol)
  sync_state: 'PENDING_UPLOAD' | 'UPLOADING' | 'UPLOADED' | 'FAILED';
  created_at: string;
}

interface SyncQueueItem {
  id: string;
  entity_type: 'FINDING' | 'MEDIA';
  entity_id: string;               // Local ID
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;    // Serialized entity data
  retry_count: number;
  max_retries: number;             // Default: 5
  last_attempt_at?: string;
  next_retry_at?: string;
  status: 'PENDING' | 'PROCESSING' | 'PAUSED_OFFLINE' | 'FAILED_FATAL';
}
```

### C. Sync Engine State Machine

The client sync pipeline utilizes a Finite State Machine (FSM). Media files are uploaded via the **TUS (Resumable Upload Protocol)** before PostgreSQL metadata commits, preventing dangling database references. Retries use exponential backoff with jitter.

```mermaid
stateDiagram-v2
    [*] --> Idle

    state Idle {
        <-- Check Network & Queue
    }

    Idle --> FieldOffline : Connection Lost / Airplane Mode
    Idle --> SyncingFinding : Connection Active & Queue Has Items

    state FieldOffline {
        [*] --> RecordLocalDb
        RecordLocalDb --> QueueMutation : Write Metadata & Media Reference
        QueueMutation --> FieldOffline : User continues capturing
    }

    FieldOffline --> SyncingMedia : Network Detected (Online Event)

    state SyncingMedia {
        [*] --> CheckPendingBlobs
        CheckPendingBlobs --> UploadMultipart : Media > 0
        UploadMultipart --> MediaUploaded : Form 200 Complete
        UploadMultipart --> PauseAndRetry : Socket Dropout / Timeout
        PauseAndRetry --> UploadMultipart : Retry with Exponential Backoff
    }

    SyncingMedia --> SyncingFinding : All Media Uploaded successfully

    state SyncingFinding {
        [*] --> SQLiteWrite
        SQLiteWrite --> VerifyAPI : Send payload to PocketBase REST API
        VerifyAPI --> MarkSynced : DB Insert Confirmed
        VerifyAPI --> HandleError : 4xx / 5xx Error
    }

    SyncingFinding --> Idle : Queue Empty
    SyncingFinding --> FatalError : Max Retries Exceeded / API Rejection

    state FatalError {
        [*] --> FlagRecordNeedsUserAttention
    }
```

### D. Temporary Loop Video (Evolution)
*   **MVP (PWA) Mitigation:** Due to mobile browser Web Media API limitations (thermal throttling, memory constraints), the MVP will implement a **Rapid Photo Buffer / Burst Capture** or manual short 30-second clips.
*   **Native Path:** The true continuous 10-minute 1080p loop buffer will be deferred to the native Android build, utilizing Qualcomm's hardware codecs (`MediaCodec` + `SurfaceTexture` on a ring-buffer file descriptor) for power efficiency.

### E. User Role & Progression System
*   **Technology:** PocketBase Auth with custom users collection fields.
*   **Roles:** `standard_scout` (Levels 1-4), `level_5_expert`.
*   **Progression Logic:** A background service evaluating user actions (e.g., +10 points for verified AI ID) to update the user's level invisibly.

### F. Edge Case & Conflict Resolution Protocols

#### Conflict Resolution (Last-Write-Wins with Field-Level Merging)

Because field discoveries are predominantly user-centric (a user updates their own findings), collision risk between multiple users on a single record is low. However, if edits occur on separate offline devices before syncing:

*   **Rule:** The system applies a **Field-Level Last-Write-Wins (LWW)** using the vector timestamp or ISO creation date.
*   **Exception:** Deleted items on the client marked offline insert a `deleted_at` soft-delete flag rather than hard-deleting locally, ensuring tombstone synchronization reaches PocketBase correctly.

#### Network Dropouts & Retry Backoff Logic

Retries avoid hammering network interfaces during weak signal states using an exponential backoff formula with random jitter:

*   **Formula:** `Retry Delay = min(Max Delay, Base Delay * 2^retry_count) + jitter`
*   **Base Delay:** 2 seconds
*   **Max Delay:** 300 seconds (5 minutes)
*   **Jitter:** Uniform random variance between 0 and 1,000 ms

#### Low Battery / Low Power Mode Handling

The engine hooks into the Network Information API (`navigator.connection`) and Battery Status API (`navigator.getBattery()`) on supported platforms:

*   **On Cellular Save Data / Low Battery (<15%):** Pause automatically uploading `VIDEO_CLIP` media objects; sync `FINDING` text metadata and low-res image thumbnails only.
*   **On Unmetered Wi-Fi / Charging:** Flush high-resolution media queue completely in background threads.

---

## 5. Production Edge-Cases & Actionable Refinements

### A. IndexedDB Blob Storage Limitations (PWA Stage)

*   **The Challenge:** Storing raw high-resolution media directly in IndexedDB across various mobile browsers (especially WebKit/iOS Safari) can lead to silent quota eviction or storage write crashes when storage exceeds ~50 MB to 100 MB.
*   **Actionable Fix:**
    *   Compress image captures client-side via `OffscreenCanvas` or WebAssembly (e.g., converting RAW/PNG to WebP at 85% quality) **prior** to writing to IndexedDB.
    *   Enforce an aggressive local storage retention policy: once `LocalMedia` achieves `sync_state: 'UPLOADED'`, replace the full local Blob with a low-res thumbnail, clearing heavy binary files from the device.

### B. SQLite Spatial Fuzzing Vector Uniformity

*   **The Challenge:** The current random offset formula generates a rectangular bounding box. Aggregating multiple public findings from a single site allows an adversary to average the fuzzed points and mathematically calculate the true centroid of the hidden site.
*   **Actionable Fix:** Implement **Polar Coordinates with Gaussian Distance Noise** or snap points to a standardized static geographic grid (e.g., Uber H3 Spatial Indexing) so public points remain deterministic and cannot be reverse-engineered through statistical averaging.

```sql
-- Enhanced Grid-Based Location Fuzzing using Hexagonal Grid Centroids
CREATE OR REPLACE FUNCTION fuzz_finding_location_grid()
RETURNS TRIGGER AS $$
DECLARE
    -- Snapping coordinates to a fixed ~1.5km grid to prevent statistical centroid calculations
    grid_size CONSTANT FLOAT := 0.015;
BEGIN
    NEW.public_fuzzed_location := ST_SetSRID(
        ST_MakePoint(
            floor(ST_X(NEW.exact_location) / grid_size) * grid_size + (grid_size / 2.0),
            floor(ST_Y(NEW.exact_location) / grid_size) * grid_size + (grid_size / 2.0)
        ), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Consolidated Architecture Matrix

| Layer | MVP (Mobile Web / PWA) | Native Target (Android / Qualcomm) |
| --- | --- | --- |
| **Local Storage** | IndexedDB via **RxDB** / Dexie.js | SQLite via **WatermelonDB** / Room |
| **Capture Buffer** | Canvas WebP Burst Capture / 30s manual clips | Hardware `MediaCodec` Ring Buffer onto file descriptor |
| **Offline Inference** | **ONNX Runtime Web** (WASM / WebGL worker) | **Qualcomm SNPE / NPU SDK** (Native C++ bindings) |
| **Media Transport** | Multipart form upload via PocketBase SDK | Multipart form upload with background Android `WorkManager` |
| **Geospatial Cache** | MBTiles vector chunks via IndexedDB Cache | MBTiles / GeoTIFF via native Mapbox SDK filesystem cache |
