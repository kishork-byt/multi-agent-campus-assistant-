# Multi-Agent Campus Assistant

## 3 AI Agents. 1 Campus.

[![Strands Agents SDK](https://img.shields.io/badge/Strands_Agents_SDK-v1.17.0-blue.svg)](https://github.com/strands-agents/sdk)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hackathon](https://img.shields.io/badge/AWS_Agents_for_Humans-Good_Neighbor_Agents-orange.svg)]()

---

### Overview

**Multi-Agent Campus Assistant** is an autonomous multi-agent campus coordination platform powered by three specialized AI agents built with the **Strands Agents SDK**:

* 🎓 **Astra — Student AI Agent**: Dedicated to student life, course events, academic attendance policies, deadlines, and study space navigation.
* 👨‍🏫 **Orion — Faculty/Staff AI Agent**: Tailored for faculty workflows, institutional duty leaves, research grant tracking, and departmental assistance.
* 🏛️ **Atlas — Admin AI Agent**: Engineered for university administrative operations, cross-campus metrics, facilities oversight, and operational logistics.

The agents understand role-specific requests, invoke authorized campus operational tools, enforce human-in-the-loop approvals for consequential actions, retrieve campus institutional knowledge via vector RAG, navigate the campus using Dijkstra graph pathfinding, and proactively surface recommendations through an autonomous Autopilot service.

---

### Problem

Higher education campus environments are severely fragmented across disconnected silos: event calendars, academic regulations, assignment trackers, support desks, campus maps, and administrative portals. 

Students, faculty, and administrators waste hours repeatedly searching across portals, tracking down regulations, finding buildings, and manually following up on approvals. Traditional campus chatbots only return static snippets and cannot take safe, authenticated, role-scoped actions on behalf of the user.

---

### Solution

Multi-Agent Campus Assistant elevates campus assistance **from asking to acting**. 

Instead of merely answering:
> *"What is the AI workshop?"*

The agent executes a coordinated autonomous workflow:
1. Searches active MongoDB event records using semantic matching and date range filtering.
2. Identifies the event and formats details for user context.
3. Detects consequential database mutation and requests explicit human approval with a cryptographically signed, single-use token.
4. Upon approval, atomically registers the student in MongoDB (`$push: registeredUsers`, `$inc: { rsvpCount: 1 }`).
5. Autonomous compound execution schedules a calendar task and 1-hour pre-event notification.
6. Returns a grounded, synthesized response citing confirmed registration.

---

### Three Agents

```
                           ┌────────────────────────┐
                           │    User Interaction    │
                           └───────────┬────────────┘
                                       │
                         [Cryptographic Session Auth]
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │       Role-Based Agent Router     │
                     └───────┬───────────┬───────────┬───┘
                             │           │           │
         Student Role        │           │           │ Admin Role
       ┌─────────────────────┘           │           └─────────────────────┐
       ▼                                 ▼                                 ▼
┌───────────────┐               ┌───────────────┐                 ┌───────────────┐
│     ASTRA     │               │     ORION     │                 │     ATLAS     │
│ Student Agent │               │ Faculty Agent │                 │  Admin Agent  │
├───────────────┤               ├───────────────┤                 ├───────────────┤
│ • Events      │               │ • Events      │                 │ • Analytics   │
│ • Tasks       │               │ • Tasks       │                 │ • Compliance  │
│ • Navigation  │               │ • Faculty RAG │                 │ • Emergency   │
│ • Academic RAG│               │ • Leave Policy│                 │ • Audit Logs  │
│ • Support     │               │ • Support     │                 │ • Navigation  │
└───────┬───────┘               └───────┬───────┘                 └───────┬───────┘
        │                               │                                 │
        └───────────────────────┬───────┴─────────────────────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │    Strands Agents SDK Runtime   │
               │   GoogleModel / Gemini Model    │
               └────────────────┬────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │   Campus Operational Tool Suite │
               └────────────────┬────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │  Human Approval Guardrail Engine│
               └────────────────┬────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │  MongoDB & Vector Knowledge Base│
               └─────────────────────────────────┘
```

#### 1. Astra — Student AI Agent
* **Audience**: Undergraduate & graduate students.
* **Scope**: Course events, workshops, hackathons, assignment deadlines, attendance rules, certificate issuance procedures, and dining/library navigation.
* **Tool Permissions**: 10 student-scoped tools (`search_events`, `register_for_event`, `create_task`, `get_tasks`, `create_notification`, `create_support_issue`, `get_support_status`, `search_campus_information`, `search_campus_location`, `calculate_campus_route`).

#### 2. Orion — Faculty/Staff AI Agent
* **Audience**: Professors, lecturers, research scholars, and department staff.
* **Scope**: Faculty leave policies, on-duty academic allowances, research grants, syllabus regulations, and campus IT service requests.
* **Tool Permissions**: 9 faculty-scoped tools (includes leave policy search, task tracking, and navigation; excludes student self-enrollment tools).

#### 3. Atlas — Admin AI Agent
* **Audience**: University deans, registrars, and system administrators.
* **Scope**: Cross-campus event oversight, service request SLA monitoring, multi-agent execution audit trails, and administrative analytics.
* **Tool Permissions**: 7 administrative tools (includes `get_admin_analytics`, full audit trail inspection, and facility management). Strictly enforces administrative clearance.

---

### Core Capabilities

- **Multi-Agent Architecture**: Three dedicated Strands Agent instances maintaining clean separation of state, memory, and prompts.
- **Strands Agents SDK Integration**: Built with `@strands-agents/sdk` v1.17.0 utilizing standard model and tool interfaces.
- **Gemini Model Provider**: Supports Google Gemini models via `@strands-agents/sdk/models/google` (`GoogleModel`).
- **Server-Side RBAC**: Cryptographic HMAC-SHA256 session token verification. Unauthenticated requests and header-spoofed elevation attempts are strictly rejected with HTTP 403.
- **Human-in-the-Loop Approval**: Consequential database mutations (e.g. event registration, administrative overrides) generate single-use, 15-minute TTL approval records before execution.
- **Approval Replay Protection**: Cryptographic tracking of resolved approvals in agent memory preventing replay attacks with HTTP 400 rejection.
- **Real MongoDB Persistence**: Official Mongoose ODM integration with atomic `$inc` and `$push` database mutations and post-mutation verification.
- **RAG Campus Knowledge Base**: 12 institutional regulatory documents divided into 21 vector chunks with cosine similarity retrieval, source citations, and confidence scoring.
- **Campus Location Search**: Multi-factor ranking algorithm prioritizing exact name, phrase match, category, and building over generic keyword hits.
- **Dijkstra Campus Navigation**: Graph pathfinding across 17 registered campus venues calculating shortest walking paths, estimated minutes, turn-by-turn HUD, and wheelchair accessibility.
- **Interactive Campus Map**: Leaflet.js map with legitimate OpenStreetMap tile provider (zero watermark or attribution errors) and real-time browser GPS tracking.
- **Autopilot Proactive Service**: Background autonomous engine that scans campus records to identify upcoming unregistered workshops and stages pending approvals.
- **Multilingual Support**: Supports English and Tamil/Tanglish campus queries.
- **Audit Logging**: Structured execution tracing stored in `AgentExecution` recording execution ID, timestamp, intent, tools used, and status.

---

### Architecture & Agentic Workflow

```
User
  │
  ▼
Authenticated Session (HMAC-SHA256 Token)
  │
  ▼
Agent Registry (Routes strictly by verified session role)
  │
  ├── Student ──► Astra Agent
  ├── Faculty ──► Orion Agent
  └── Admin   ──► Atlas Agent
        │
        ▼
  Strands Agent Runtime (@strands-agents/sdk v1.17.0)
        │
        ▼
  Model Reasoning & Tool Selection (GoogleModel / Gemini)
        │
        ▼
  Role-Authorized Operational Tool
        │
        ├── search_events
        ├── search_campus_information (Vector RAG)
        ├── search_campus_location
        └── calculate_campus_route (Dijkstra)
        │
        ▼
  Requires State Mutation?
        │
        ├── YES ──► Human Approval Gate (Generate approvalId, return WAITING_APPROVAL)
        │                 │
        │                 ├── User Rejection ──► Status: CANCELLED (0 MongoDB mutations)
        │                 │
        │                 └── User Approval  ──► Atomic MongoDB Update ($inc, $push)
        │                                        Mark approvalId resolved (Block replay)
        │
        └── NO  ──► Direct Tool Result Return
        │
        ▼
  Grounded Model Response Synthesis & Source Citations
```

---

### Security & Guardrails

1. **Cryptographically Signed Session Tokens**: Session tokens use HMAC-SHA256 with server-side secrets. Arbitrary HTTP headers (e.g., `x-user-role: admin`) are strictly ignored unless accompanied by a verified signature.
2. **Strict Role-Tool Isolation**: Astra, Orion, and Atlas register only role-appropriate tools. A student agent cannot invoke administrative analytics or modify faculty quotas.
3. **Perimeter Guardrails Against Prompt Injection**: Guardrail pre-checks immediately intercept queries attempting to access confidential salary, payroll, or budget records, returning a clean `BLOCKED` status without passing to tools.
4. **Single-Use Approval Tokens**: Approval IDs (`appr_*`) expire after 15 minutes and can only be executed once. Re-submitting an already resolved token returns `Security Violation: This approval request has already been executed or resolved.`
5. **Credential Safety**: All environment secrets (`.env`) are excluded from version control via `.gitignore`. The repository template `backend/.env.example` contains variable keys only.

---

### Tech Stack

* **Runtime & Language**: Node.js (v18+), JavaScript (ES Modules & CommonJS)
* **Agent Framework**: `@strands-agents/sdk` v1.17.0
* **Model Provider**: Google Gemini (`@strands-agents/sdk/models/google`) / `gemini-2.5-flash`
* **Backend Framework**: Express.js
* **Database & ODM**: MongoDB, Mongoose v8.x, `mongodb-memory-server` (for isolated automated testing)
* **Search & Navigation**: Dijkstra shortest path algorithm, TF-IDF vector embeddings with cosine similarity
* **Mapping & Geospatial**: Leaflet.js, OpenStreetMap Carto tiles, HTML5 Geolocation API
* **Frontend**: Vanilla HTML5, CSS3 (glassmorphic dark theme), modular JavaScript Single Page Application (SPA)

---

### Installation & Setup

#### Prerequisites
* Node.js (v18.0.0 or later)
* npm (v9.0.0 or later)
* MongoDB (Local instance or MongoDB Atlas cluster; test suites fall back to in-memory MongoDB automatically)

#### 1. Clone the Repository
```bash
git clone https://github.com/your-org/multi-agent-campus-assistant.git
cd multi-agent-campus-assistant
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Configure Environment Variables
Copy the template file to `.env`:
```bash
cp .env.example .env
```
Edit `backend/.env` with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/campus-assistant
PORT=5000
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=
```
*(Note: If `MONGODB_URI` is omitted or unavailable, the backend automatically spins up an in-memory MongoDB fallback for testing).*

#### 4. Run the Backend Server
```bash
npm start
```
The server starts at `http://localhost:5000` and serves the web frontend directly.

#### 5. Access the Web Application
Open your browser and navigate to:
```
http://localhost:5000
```

---

### Environment Variables

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | HTTP port for Express backend server |
| `MONGODB_URI` | Optional | Local memory | MongoDB connection string (Atlas or local) |
| `AI_PROVIDER` | Required | `gemini` | Active AI provider (`gemini` or `bedrock`) |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model ID for GoogleModel |
| `GEMINI_API_KEY` | Conditional | Empty | Google Gemini API key (required for cloud inference) |
| `AWS_REGION` | Optional | `us-east-1` | AWS Region (when `AI_PROVIDER=bedrock`) |
| `AWS_ACCESS_KEY_ID`| Optional | Empty | AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY`| Optional | Empty | AWS Secret Access Key |
| `BEDROCK_MODEL_ID` | Optional | Claude 3 Haiku | Amazon Bedrock model ID |

---

### Testing & Verification

The repository includes a comprehensive, verified test suite covering all multi-agent boundaries, navigation algorithms, and approval lifecycles:

```bash
# Run multi-agent system & RAG vector search tests (22/22)
node backend/testMultiAgentSystem.js

# Run campus map, 17 venues, and Dijkstra routing tests (6/6)
node backend/testCampusNavigation.js

# Run three distinct agents (Astra, Orion, Atlas) isolation tests (7/7)
node backend/testThreeAgents.js

# Run all 10 live API endpoints verification (10/10)
node backend/testApiEndpoints.js

# Run notifications module integration tests (11/11)
node backend/testNotificationsModule.js

# Run events management CRUD integration tests (7/7)
node backend/testEventsIntegration.js

# Run community anonymous forum integration tests (8/8)
node backend/testCommunityIntegration.js

# Run frontend architecture and browser delivery tests (6/6)
node backend/testFrontendIntegration.js

# Run real model invocation test (verifies cloud LLM integration)
node backend/testRealModelInvocation.js
```

#### Test Execution Summary
```
================================================================================
TEST SUITE                                           RESULT         PASS RATE
================================================================================
testMultiAgentSystem.js (Multi-Agent & RAG)          PASSED         22 / 22 (100%)
testCampusNavigation.js (Map, 17 Venues, Dijkstra)   PASSED          6 /  6 (100%)
testThreeAgents.js (Astra, Orion, Atlas Isolation)   PASSED          7 /  7 (100%)
testApiEndpoints.js (All 10 Live HTTP Endpoints)     PASSED         10 / 10 (100%)
testNotificationsModule.js (Full Notification Flow)  PASSED         11 / 11 (100%)
testEventsIntegration.js (CRUD & MongoDB Sync)       PASSED          7 /  7 (100%)
testCommunityIntegration.js (Anonymous Posts/Audit)  PASSED          8 /  8 (100%)
testFrontendIntegration.js (Views & Tile Provider)   PASSED          6 /  6 (100%)
================================================================================
```

---

### Demo Workflow

**User Query**:
> *"Find the AI workshop this week, register me, and remind me one hour before."*

**Autonomous Agentic Flow**:
1. **Role Verification**: Session verified as Student $\rightarrow$ routes to **Astra**.
2. **Tool Selection**: Astra selects `search_events` with parameters `{ keyword: "AI", dateFrom: "2026-09-10", dateTo: "2026-09-16" }`.
3. **Database Query**: Finds `Annual Campus AI Hackathon 2026` (`e2`).
4. **Human Approval Gate**: Detects consequential write; generates `approvalId: appr_*` with intent `REGISTER_AND_REMIND`; renders interactive Action Card in chat.
5. **Rejection Safety**: If user clicks **Cancel**, action is marked `CANCELLED` and **0 mutations** occur in MongoDB.
6. **Execution on Approval**: If user clicks **Confirm Registration**:
   - Updates MongoDB event record (`registeredUsers.push({ userId })`, `rsvpCount: +1`).
   - Automatically creates task: *"Attend Annual Campus AI Hackathon 2026"* scheduled with 1-hour reminder.
   - Automatically posts notification: *"Registration Confirmed: Annual Campus AI Hackathon 2026"*.
   - Invalids `approvalId` preventing replay attacks.
7. **Synthesis**: Astra outputs grounded confirmation with venue, date, and reminder schedule.

---

### Security Testing

* **Role Isolation Test**: Student session querying faculty leave policies is blocked; prompt injection for salary/budget records is immediately intercepted.
* **Header Spoofing Test**: Sending raw HTTP headers (`x-user-role: admin`, `x-user-id: ADM-001`) without a valid HMAC signature returns `403 Forbidden`.
* **Approval Replay Test**: Re-submitting an already executed `approvalId` returns HTTP 400 (`Security Violation: This approval request has already been executed or resolved`).
* **Database Mutation Safety**: Rejection of an approval guarantees zero database state changes.

---

### Existing Work Disclosure

An earlier campus assistant prototype provided part of the initial application foundation, including baseline portal layouts, UI styles, and preliminary data models. During the **AWS Agents for Humans Hackathon 2026** submission period, the project was fundamentally re-architected and extended with:

* Complete multi-agent Strands architecture (`@strands-agents/sdk` v1.17.0).
* Distinct specialized agents: **Astra** (Student), **Orion** (Faculty/Staff), and **Atlas** (Admin).
* Model-driven tool execution and structured tool definitions.
* Server-side cryptographic HMAC-SHA256 role authentication and RBAC perimeter guardrails.
* Human-in-the-loop approval engine with replay protection and mutation safety.
* Autonomous Autopilot service for proactive recommendations.
* 17-venue campus graph with Dijkstra shortest path engine, turn-by-turn HUD, and wheelchair accessibility.
* 12-document campus vector RAG with cosine similarity and citation generation.
* Comprehensive 10-suite automated test and verification infrastructure.

---

### License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
