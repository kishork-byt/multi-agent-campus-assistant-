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
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
let dbStatus = {
  connected: false,
  message: "Initializing connection..."
};

if (uri) {
  mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
      console.log("Successfully connected to MongoDB Atlas via Mongoose!");
      dbStatus = {
        connected: true,
        message: "Successfully connected to MongoDB Atlas"
      };
    })
    .catch(async (err) => {
      console.error("MongoDB Atlas connection failed:", err.message);
      try {
        console.log("Initializing in-memory MongoDB database fallback...");
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log("Successfully connected to in-memory MongoDB database via Mongoose!");
        dbStatus = {
          connected: true,
          message: "Successfully connected to in-memory MongoDB database"
        };
      } catch (memErr) {
        console.error("In-memory MongoDB fallback failed:", memErr.message);
        dbStatus = {
          connected: false,
          message: err.message
        };
      }
    });
} else {
  dbStatus = {
    connected: false,
    message: "MONGODB_URI environment variable is missing"
  };
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, "..")));

// API Routes
app.use("/api/students", require("./routes/students"));
app.use("/api/faculty", require("./routes/faculty"));
app.use("/api/events", require("./routes/events"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/community", require("./routes/community"));
app.use("/api/ai", require("./routes/ai"));

// Root Health Endpoint
app.get("/", (req, res) => {
  res.json({
    message: "College AI Assistant Backend is running!",
    database: dbStatus,
    endpoints: [
      "/api/students",
      "/api/faculty",
      "/api/events",
      "/api/announcements",
      "/api/tasks",
      "/api/notifications",
      "/api/community/posts",
      "/api/community/comments",
      "/api/community/support"
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});