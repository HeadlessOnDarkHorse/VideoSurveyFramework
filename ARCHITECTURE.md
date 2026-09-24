# Eon Base Project: Technical Architecture and Design Specifications

## 1. Proposed System Architecture

The Eon platform adopts a modern, scalable, and modular client-server architecture, initially developed as a mobile-first web application with a clear trajectory toward a native Android application optimized for Qualcomm Snapdragon hardware.

### High-Level Components

*   **Client / Frontend (Mobile-First Web & Future Native App)**
    *   **Core Framework:** React 18 with Vite, TypeScript.
    *   **Styling & UI:** TailwindCSS, shadcn/ui, Framer Motion for gamified animations.
    *   **Mapping Interface:** Interactive social and geological map integration (e.g., Leaflet or Mapbox).
    *   **Device APIs (Hardware Access):**
        *   **Camera/ISP:** High-resolution image capture for finding identification.
        *   **Sensors:** GPS, compass, and real-time geospatial data tracking.
        *   **Audio/Microphone:** Voice input for real-time AI consultations.
    *   **On-Device Processing (Qualcomm NPU Target):** Local inference for the AI Assistant and computer vision tasks to reduce latency, cloud costs, and enable offline field use.

*   **Backend Services (Supabase)**
    *   **Database (PostgreSQL):** Relational data storage for user profiles, geological records, finding metadata, and community map points.
    *   **Authentication:** Role-based access control (Standard Scouts vs. Level 5 Accredited Experts).
    *   **Storage:** Secure cloud storage for the Private Digital Gallery (photos and fossil/mineral chips).

*   **AI Engine & Processing**
    *   **Conversational & Scientific Guide:** Large Language Model (LLM) fine-tuned with a "Master Geologist/Paleontologist" prompt.
    *   **Computer Vision:** Image recognition models for mineral and fossil identification.

*   **Specialized Modules**
    *   **Temporary Loop Video System:** A power-efficient, continuous recording buffer that stores video locally and deletes it every 5-10 minutes, allowing users to retrospectively save clips of sudden discoveries.
    *   **Learning Progression Engine:** An invisible backend tracking system that monitors user interactions, debates, and finds to progress them through Levels 1-4 and prepare them for Level 5 accreditation.

---

## 2. Infrastructure Diagram

```mermaid
graph TD
    subgraph Client [Client Device Mobile/Web]
        UI[User Interface React/Tailwind]
        Map[Interactive Map Module]
        VideoLoop[Loop Recording System]
        LocalDB[Local Encrypted Gallery Cache]

        subgraph Hardware [Device Hardware / Snapdragon]
            Cam[Camera / ISP]
            GPS[Geolocation / Sensors]
            Mic[Audio Input]
            NPU[On-Device AI NPU]
        end
    end

    subgraph Backend [Backend Services Supabase]
        Auth[Authentication & Profiles]
        DB[(PostgreSQL Database)]
        Storage[Encrypted Cloud Storage]
        LearningEngine[Level Progression Logic]
    end

    subgraph External [External APIs / Models]
        LLM[Geologist AI API]
        GeoAPI[Geospatial Data API]
    end

    %% Client Interactions
    UI <--> Map
    UI <--> VideoLoop
    UI <--> LocalDB
    UI --> Cam
    UI --> GPS
    UI --> Mic

    %% Hardware Processing
    Cam --> NPU : Visual ID
    Mic --> NPU : Voice Processing
    NPU --> UI

    %% Client to Backend
    UI <--> Auth
    UI <--> DB : Sync Findings/Map Data
    UI <--> Storage : Sync Private Gallery
    DB <--> LearningEngine

    %% Fallback/Cloud AI
    UI <--> LLM : Fallback / Cloud AI Query
    Map <--> GeoAPI
```

---

## 3. User Workflow

The user journey is split into three main contexts: Field (Active Discovery), Home (Management & Community), and Education (Mentoring & Progression).

### Workflow A: The Field Discovery (Active Use)
1.  **Preparation:** User opens the Eon app and accesses the **Interactive Map** to view previously recorded geological and chemical properties in the area.
2.  **Exploration:** User activates the **Temporary Loop Video** feature while hiking.
3.  **Discovery:** User finds an interesting mineral or fossil.
4.  **Capture & Rescue:** User triggers the video "rescue" button to save the last 5 minutes of footage showing the exact moment of discovery.
5.  **AI Consultation:**
    *   User takes a high-resolution photo or uses voice input to ask the **AI Assistant** about the finding.
    *   The AI (ideally running on-device) explains the formation, geological age, and chemical composition in real-time, providing gamified "natural dopamine" feedback.
6.  **Geolocation:** The app automatically tags the finding with GPS coordinates.
7.  **Save/Share:** User chooses to save the finding to their **Private Digital Gallery** or share the discovery clip on the **Social Map**.

### Workflow B: Post-Expedition & Management (Home Use)
1.  **Cataloging:** User reviews their Private Digital Gallery, organizing high-value pieces. The database encrypts and secures location data to prevent looting.
2.  **Community Interaction:** User accesses the social map to discuss findings with other explorers.
3.  **Mentorship:** A Level 5 Expert reviews a public finding, validates the identification, and provides feedback.
4.  **Progression:** The "Invisible Learning Engine" registers the user's correct identification and community engagement, incrementing their progress toward the next level.

### Workflow C: Institutional Collaboration
1.  **Donation:** User decides to donate a significant piece to an allied museum.
2.  **Integration:** The museum displays the physical piece alongside a generated QR code.
3.  **Immortalization:** Visitors scan the QR code to view the user's original "discovery clip" hosted on the Eon platform, linking the passion of the amateur with the institution.

---

## 4. Detailed Design Specifications (MVP Focus)

The Minimum Viable Product focuses on establishing the core base engine.

### A. Basic Map Interface
*   **Technology:** React Leaflet or Mapbox GL JS.
*   **Features:**
    *   Display user's current GPS location.
    *   Toggle between "Public Social Layer" (community findings, discussions) and "Geological Record Layer" (chemical properties, historical data).
    *   Ability to drop pins (Waypoints) that can be marked Public or Private.
*   **Data Structure:** GeoJSON for efficient rendering and spatial queries in PostgreSQL (PostGIS).

### B. AI Integration Module
*   **Technology:** OpenAI API (Cloud) transitioning to Qualcomm Neural Processing SDK (On-Device).
*   **Prompt Engineering:** System prompt initialized as a pedagogical, encouraging "Master Geologist".
*   **Input Handling:**
    *   Image processing for visual identification.
    *   Text-to-text and Speech-to-text capabilities for conversational querying.
*   **Output:** Structured JSON responses parsed by the UI to display scientific facts, age, and composition separately from conversational text.

### C. Private Digital Gallery
*   **Technology:** Supabase Storage (Buckets) and PostgreSQL.
*   **Security:** Row Level Security (RLS) policies ensuring users can only read/write their own gallery items unless explicitly shared.
*   **Schema (Findings Table):**
    *   `id` (UUID)
    *   `user_id` (UUID, Foreign Key)
    *   `image_url` (String)
    *   `video_clip_url` (String, nullable)
    *   `ai_classification` (JSON)
    *   `gps_coordinates` (Point, encrypted/fuzzed for public view if sensitive)
    *   `is_public` (Boolean)

### D. User Role & Progression System
*   **Technology:** Supabase Auth with custom user metadata.
*   **Roles:**
    *   `standard_scout` (Levels 1-4): General users learning and collecting.
    *   `level_5_expert`: Accredited paleontologists/teachers with special privileges (mentorship, protected site access).
*   **Progression Logic:** A background service evaluating user actions (e.g., +10 points for a verified AI ID, +50 points for an expert-validated public post) to update the user's level invisibly, unlocking accreditation exam options at Level 4.

### E. Temporary Loop Video (Future Milestone)
*   **Mechanism:** Implement a circular buffer recording mechanism utilizing the device's MediaRecorder API (web) or native Camera2/MediaCodec APIs (Android).
*   **Storage:** Write chunks sequentially to local temporary storage. Overwrite the oldest chunk when the buffer limit (e.g., 10 minutes) is reached.
*   **Trigger:** Upon user action, stitch the current buffer chunks together and save to a persistent file for upload.
