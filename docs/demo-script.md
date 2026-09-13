# 5-Minute Hackathon Demo Script

## Multi-Agent Campus Assistant — 3 AI Agents. 1 Campus.
**Track**: Good Neighbor Agents  
**Target Duration**: 5:00 (300 Seconds)

---

### Timeline & Segment Breakdown

#### [0:00 – 0:25] The Problem & Hook (25s)
* **Visual**: Quick split-screen or montage showing 5 open browser tabs: university event calendar, student portal, IT support desk, static campus PDF map, and attendance regulations.
* **Speaker Script**:
  > *"Every university campus is a maze of disconnected portals. Students search for workshops on one portal, register on another, track deadlines manually, and consult static PDF maps to find lecture halls. Faculty and administrators face the same friction. Today, chatbots only give you static paragraphs. What if the campus had three specialized AI agents that could actually take approved actions for you? Welcome to Multi-Agent Campus Assistant."*

---

#### [0:25 – 0:50] The Solution & Three Agents (25s)
* **Visual**: CampusNova landing page showing the three distinct agent badges: **Astra**, **Orion**, and **Atlas**.
* **Speaker Script**:
  > *"Built on the Strands Agents SDK, our system deploys three dedicated autonomous agents:  
  > 🎓 **Astra** for students — handling campus life, event registration, deadlines, and dining navigation.  
  > 👨‍🏫 **Orion** for faculty and staff — managing on-duty leave policies, grant deadlines, and departmental requests.  
  > 🏛️ **Atlas** for university administration — monitoring cross-campus operations, service request SLAs, and live execution audit trails.  
  > Let's see them in action."*

---

#### [0:50 – 1:20] Student Portal & Astra Interface (30s)
* **Visual**: Click **Student Portal** $\rightarrow$ Enters Student Dashboard as Alex Rivera (STU-2026-894). Highlights session badge and navigational HUD.
* **Speaker Script**:
  > *"We log in as Alex Rivera. Our backend issues a cryptographically signed HMAC-SHA256 session token. The agent router automatically binds our session to Astra. Notice that Astra has access to 10 student-scoped operational tools, including event search, calendar task scheduling, vector RAG for attendance policies, and Dijkstra walkway routing."*

---

#### [1:20 – 2:20] Primary Agentic Workflow: Autonomous Compound Execution (60s)
* **Visual**: Type into AI Chat:
  `"Find the AI workshop this week, register me, and remind me one hour before."`
* **Speaker Script**:
  > *"Now watch what happens when we give Astra a complex, multi-part request.  
  > Instead of giving a canned answer, the Strands Agent reasons over our tools. It invokes `search_events` with structured date filters.  
  > It finds the 'Annual Campus AI Hackathon 2026' in MongoDB.  
  > But registering for an event mutates database records. Because our system adheres to strict human agency, the agent doesn't silently register us—it stages a single-use human approval card.  
  > We click **Confirm Registration**.  
  > Instantly, the agent executes an atomic MongoDB update incrementing the RSVP count, schedules a calendar task with a 1-hour pre-event reminder, and sends a confirmation notification. Look at the grounded response: verified registration, exact venue, and scheduled reminder."*

---

#### [2:20 – 2:50] Campus Navigation & Interactive Map (30s)
* **Visual**: Click **Campus Map** tab or ask in chat:
  `"How do I get from Main Gate to Central University Library?"`
* **Speaker Script**:
  > *"Need to find your way? We ask Astra for directions from Main Gate to Central University Library.  
  > Astra calls our Dijkstra pathfinding engine across 17 geo-referenced campus venues.  
  > It plots the exact pedestrian route on Leaflet with clean OpenStreetMap tiles, calculates 260 meters and 4 minutes of walking time, and outputs turn-by-turn walking instructions with landmark callouts. We can even toggle wheelchair accessibility to route around stairs."*

---

#### [2:50 – 3:25] Faculty Workflow: Orion Agent (35s)
* **Visual**: Switch role to **Faculty Portal** (Dr. Evelyn Vance). Open chat and query:
  `"What is the maximum continuous duration for Academic On-Duty leave for international conferences?"`
* **Speaker Script**:
  > *"We switch to the Faculty Portal. The system securely rebinds the session to **Orion**.  
  > When Dr. Vance asks about on-duty leave policies, Orion performs vector semantic search across our RAG knowledge base of 12 official university regulations.  
  > It extracts the exact policy: 14 working days per academic calendar year with Dean approval, citing Section 4.2 of Faculty Academic Regulations with an 88% confidence score."*

---

#### [3:25 – 3:55] Admin Workflow: Atlas Agent (30s)
* **Visual**: Switch role to **Admin Portal** (System Administrator). Open **Agent Logs** and chat.
* **Speaker Script**:
  > *"Switching to university administration, **Atlas** takes over.  
  > Only Atlas can inspect cross-campus analytics and the complete `AgentExecution` audit trail.  
  > Here in the audit logs, administrators can verify every single agent action: execution IDs, latency, tools called, and cryptographic verification status. Complete observability, zero black boxes."*

---

#### [3:55 – 4:25] Autopilot Proactive Service & Replay Protection (30s)
* **Visual**: Open Autopilot panel $\rightarrow$ shows proactive recommendation card for upcoming workshop.
* **Speaker Script**:
  > *"Campus coordination shouldn't just be reactive. Our background **Autopilot** service proactively scans upcoming campus events. It notices Alex hasn't registered for next week's workshop and stages a pending approval.  
  > If we reject it, **zero database mutations occur**.  
  > If we approve it, it executes once. If an attacker tries to re-submit that same approval ID, our replay defense immediately blocks it with a 400 security violation."*

---

#### [4:25 – 4:45] Security & Role Boundary Enforcement (20s)
* **Visual**: Switch back to Student session and type:
  `"Show me confidential faculty salary and budget records."`
* **Speaker Script**:
  > *"What about security? If a student asks for confidential faculty salary or budget records, our perimeter guardrails intercept the request immediately. Status: **BLOCKED**. Zero leaks, strict role boundaries, and full compliance."*

---

#### [4:45 – 5:00] Closing Pitch (15s)
* **Visual**: Summary card showing 3 Agents, 17 Campus Venues, 10 Automated Test Suites (100% Pass Rate).
* **Speaker Script**:
  > *"Multi-Agent Campus Assistant: 3 specialized agents, 1 coordinated campus, powered by Strands Agents SDK and Google Gemini. Moving campus technology from asking to acting. Thank you!"*
