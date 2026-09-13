const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Fallback to system DNS if setServers fails
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve frontend static assets (HTML, CSS, JS) from parent directory
app.use(express.static(path.join(__dirname, "../")));

let dbStatus = {
  connected: false,
  message: "Initializing connection..."
};

// API Routes - Core Models & Services
app.use("/api/students", require("./routes/students"));
app.use("/api/faculty", require("./routes/faculty"));
app.use("/api/events", require("./routes/events"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/community", require("./routes/community"));

// AI & Multi-Agent Routes
app.use("/api/ai", require("./routes/ai"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/service-requests", require("./routes/serviceRequests"));
app.use("/api/knowledge-base", require("./routes/knowledgeBase"));
app.use("/api/agent-logs", require("./routes/agentLogs"));
app.use("/api/campus", require("./routes/campus"));
app.use("/api/agent", require("./routes/agent"));

// Data-Driven College Management Portal APIs
app.use("/api/student", require("./routes/studentPortal"));
app.use("/api/staff", require("./routes/staffPortal"));
app.use("/api/admin", require("./routes/adminPortal"));

// Health Endpoints
const { getActiveModelRuntimeState } = require("./services/llm/strandsModelFactory");

app.get("/api/health", (req, res) => {
  const modelState = getActiveModelRuntimeState();
  res.json({
    message: "CampusNova Autonomous Campus Agent Backend is running!",
    agent: "CampusNova (Strands SDK v1.17.0)",
    strandsVersion: "v1.17.0",
    tagline: "From asking to acting.",
    database: dbStatus,
    activeProvider: modelState.activeProvider,
    activeModelId: modelState.activeModelId,
    runtimeModelState: modelState.state,
    modelProviderDetails: modelState.details,
    isModelConfigured: modelState.isConfigured,
    awsBedrockSupported: true,
    googleModelSupported: true
  });
});

app.get("/", (req, res, next) => {
  // If static index.html exists, express.static handles it; otherwise return JSON
  res.sendFile(path.join(__dirname, "../index.html"), err => {
    if (err) next();
  });
});

// API 404 Fallback Middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, error: "API endpoint not found" });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack || err.message);
  res.status(500).json({ success: false, error: "Internal server error" });
});

async function checkAndAutoSeed() {
  try {
    const Department = require("./models/Department");
    const count = await Department.countDocuments();
    if (count === 0) {
      console.log("Database empty on start. Running initial database seeder...");
      const seedDatabase = require("./seedDatabase");
      await seedDatabase();
    }
  } catch (e) {
    console.error("Auto-seed check failed:", e.message);
  }
}

async function seedDefaultEvents() {
  try {
    const Event = require("./models/Event");
    const count = await Event.countDocuments();
    if (count === 0) {
      console.log("Seeding default events into MongoDB...");
      await Event.create([
        {
          eventId: "e1",
          title: "AI Workshop",
          date: "Sept 12, 2026",
          time: "10:00 AM",
          location: "Innovation Hub",
          venue: "Innovation Hub",
          tag: "Workshop",
          category: "Academic",
          desc: "Hands-on workshop on autonomous AI agents and intelligent systems.",
          organizer: "AI Student Chapter",
          status: "Approved",
          rsvpCount: 0,
          registeredUsers: []
        },
        {
          eventId: "e2",
          title: "Annual Campus AI Hackathon 2026",
          date: "Sept 12, 2026",
          time: "09:00 AM",
          location: "Innovation Hub",
          venue: "Innovation Hub",
          tag: "Hackathon",
          category: "Hackathon",
          desc: "Build cutting-edge autonomous AI agent applications with prizes.",
          organizer: "Campus Innovation Council",
          status: "Approved",
          rsvpCount: 0,
          registeredUsers: []
        },
        {
          eventId: "e3",
          title: "Guest Lecture: Quantum Computing & Ethics",
          date: "Sept 18, 2026",
          time: "02:00 PM",
          location: "Main Auditorium",
          venue: "Main Auditorium",
          tag: "Lecture",
          category: "Academic",
          desc: "Keynote presentation by MIT guest scholar Dr. Aris Thorne.",
          organizer: "Computer Science Dept",
          status: "Approved",
          rsvpCount: 0,
          registeredUsers: []
        }
      ]);
      console.log("Default events successfully seeded into MongoDB!");
    }
  } catch (err) {
    console.warn("Event auto-seed notice:", err.message);
  }
}

async function seedDefaultTasks() {
  try {
    const Task = require("./models/Task");
    const count = await Task.countDocuments();
    if (count === 0) {
      await Task.create([
        {
          title: "Review Machine Learning Assignment",
          dueDate: "Tomorrow at 5:00 PM",
          priority: "High",
          status: "todo",
          userId: "STU-2026-894",
          desc: "Complete linear regression and decision tree questions."
        },
        {
          title: "Submit Mini Project Report",
          dueDate: "Sept 12, 2026, 5:00 PM",
          priority: "High",
          status: "todo",
          userId: "STU-2026-894",
          reminderTime: "1 hour before",
          desc: "Mini project report submission."
        }
      ]);
    }
  } catch (err) {
    console.warn("Task auto-seed notice:", err.message);
  }
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  const uri = process.env.MONGODB_URI;
  let connected = false;
  if (uri) {
    try {
      console.log("Connecting to MongoDB Atlas...");
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
      console.log("Successfully connected to MongoDB Atlas via Mongoose!");
      dbStatus = { connected: true, message: "Successfully connected to MongoDB Atlas" };
      connected = true;
    } catch (err) {
      console.warn("MongoDB Atlas connection timed out/failed:", err.message);
    }
  }

  if (!connected) {
    console.log("Initializing local MongoDB database fallback...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      console.log("Successfully connected to local MongoDB database via Mongoose!");
      dbStatus = { connected: true, message: "Successfully connected to local MongoDB database" };

      const cleanup = async () => {
        try { await mongod.stop(); } catch (e) {}
        process.exit(0);
      };
      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);
    } catch (memErr) {
      console.error("Local MongoDB fallback failed:", memErr.message);
      dbStatus = { connected: false, message: memErr.message };
    }
  }

  // Seed knowledge base, events, tasks, and initial academic database
  try {
    await checkAndAutoSeed();
    const ragService = require("./services/ragService");
    await ragService.initializeKnowledgeBase();
    await seedDefaultEvents();
    await seedDefaultTasks();
    console.log("Knowledge base, events, tasks, and portal data successfully initialized!");
  } catch (initErr) {
    console.warn("Init notice:", initErr.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };