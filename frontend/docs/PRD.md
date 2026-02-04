# PRD: SmartFab Food Platform

| Version | Date | Author | Status |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-01-07 | SmartFab AI | Draft |

## 1. Product Overview
SmartFab Food is an AI+IoT driven SaaS platform for the food production industry, targeting 50-500 person enterprises. It bridges the gap between physical production (IoT devices, cameras) and digital management (ERP, planning) using Generative AI as the interface.

**Target Users**: Food Processing Plants, Agricultural Co-ops, Aquaculture Farms.

## 2. User Roles & Personas
1.  **Factory Director (Admin)**: Oversees all ops. Cares about cost, efficiency, and safety.
    *   *Need*: "I need a single dashboard to see if we are making money today."
2.  **Production Manager**: Schedules lines, assigns workers.
    *   *Need*: "I need to know if we can meet the Friday deadline."
3.  **Quality Inspector**: Checks raw materials and finished goods.
    *   *Need*: "I need to quickly log defects without slowing down the line."
4.  **Warehouse Keeper**: Manages inventory, FIFO.
    *   *Need*: "Tell me which pallet to use next so it doesn't expire."
5.  **Line Operator**: Operates machinery, reports output.
    *   *Need*: "Big buttons, simple instructions. Don't make me type."
6.  **Maintenance Tech**: Fixes machines.
    *   *Need*: "Alert me *before* the machine breaks."
7.  **Sales/Procurement**: Inputs orders, buys materials.
8.  **Consumer (End User)**: Scans QR code for traceability.

## 3. Core Functional Requirements (MoSCoW)

### Must Have (P0)
*   **Production Management Center**: Production planning, Batch tracking, Cost recording.
*   **Material & Warehouse**: Batch entry (15 fields), FIFO logic, Stock/Inventory management.
*   **IoT Integration**: MQTT Service for scales, Thermometer integration.
*   **Quality & Traceability**: Quality checks (Inbound/Process/Outbound), Bi-directional Traceability, QR Code generation.
*   **AI System**: DashScope connection, NLP for command execution ("Change output to 200").
*   **User Management**: RBAC (8 roles), Multi-factory support.

### Should Have (P1)
*   **AI Cost Analysis**: 5-dimension drill-down.
*   **Visual Counting**: YOLO integration for product counting.
*   **Equipment Lifecycle**: Maintenance logs, Status monitoring.
*   **Mobile App/H5**: For operators and moving staff (GPS clock-in).
*   **Reporting**: 13 standard reports + Export.

### Could Have (P2)
*   **Virtual Scale Simulator**: For testing/training.
*   **AI Multi-turn Dialogue**: For complex queries.
*   **Blueprint/Template System**: Fast onboarding for new factories.
*   **Hikvision ISAPI**: Advanced security alerts (Intrusion detection).

### Won't Have (MVP)
*   Custom hardware manufacturing (we use off-the-shelf).
*   Full financial accounting (we export to Finance ERP).

## 4. Key Task Flows

### 4.1. Order to Production (The "Happy Path")
1.  **Sales** enters Order #1001 for 5000 units of "Spicy Sauce".
2.  **AI/Planner** analyzes stock. Detects raw material "Chili" is sufficient but "Bottle caps" low.
3.  **Procurement** orders caps.
4.  **Manager** creates Production Plan. AI suggests Line 2 (optimized for Sauce).
5.  **Warehouse** receives "Pick List" (FIFO enabled). Scans Batch A of Chili.
6.  **Operator** sees "Start Job" on tablet.
7.  **IoT Scale** records ingredient weights automatically.
8.  **Process**: Mixing -> Cooking (Temp sensors logging to cloud) -> Bottling.
9.  **Visual Counter** counts 5000 bottles.
10. **Quality** creates "Finished Good Inspection". Pass.
11. **Warehouse** puts away finished goods.
12. **System** generates Traceability QR.

### 4.2. Emergency Intervention
1.  **AI Monitor** detects "Oven Temp" rising above threshold on Line 1.
2.  **System** sends Push Notification to **Maintenance Tech**.
3.  **Tech** acknowledges, fixes, logs "Filter Change".
4.  **AI** updates "Equipment Health Score".

## 5. Data Structures (Core Entities)

### `ProductBatch`
*   `id`: UUID
*   `batch_code`: string (e.g., "20260115-A-001")
*   `product_id`: User -> Product
*   `status`: enum (Planned, InProgress, QualityCheck, Completed, Released)
*   `created_at`: timestamp
*   `expiry_date`: timestamp
*   `line_id`: ID
*   `meta`: JSON (AI analysis tags)

### `TraceabilityRecord`
*   `id`: UUID
*   `batch_id`: FK
*   `stage`: enum (Raw, Process, Pack, Ship)
*   `actor_id`: UserID
*   `timestamp`: timestamp
*   `iot_data_snapshot`: JSON (Temp, Weight, ImageURL)
*   `geo_location`: string

### `IoTDevice`
*   `id`: UUID
*   `type`: enum (Scale, Camera, Sensor, Printer)
*   `protocol`: enum (MQTT, ISAPI, HTTP)
*   `status`: enum (Online, Offline, Error)
*   `config`: JSON (Thresholds, IP, Topic)

## 6. Non-Functional Requirements
*   **Reliability**: Offline mode for handhelds (sync when online).
*   **Performance**: Traceability query < 3 seconds.
*   **Scalability**: Support 1000+ IoT messages/second per tenant.
*   **Accessibility**: High contrast mode for factory floor (bad lighting).
