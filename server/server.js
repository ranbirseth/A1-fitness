require("dotenv").config();
const User = require("./models/user.model");
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const { connectDb, isDbConnected } = require("./config/db");
const { asyncHandler } = require("./utils/asyncHandler");
const { seedData } = require("./seeds/seedLogic");
const { connectRedis } = require("./config/redis");
const { configureCloudinary } = require("./config/cloudinary");
const { errorHandler } = require("./middlewares/error.middleware");
const { startExpiryReminderJob } = require("./jobs/expiryReminder.job");

const path = require("path");

const corsOptions = {
  origin: (origin, callback) => {
    // If no origin (e.g. server-to-server or same origin), allow it
    if (!origin) return callback(null, true);
    
    const clientOrigin = process.env.CLIENT_ORIGIN || "*";
    if (clientOrigin === "*") return callback(null, true);
    
    // Split, trim, and also remove trailing slashes for better resilience
    const allowedOrigins = clientOrigin.split(",").map(o => o.trim().replace(/\/$/, ""));
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed. Allowed origins: ${clientOrigin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

const app = express();
const server = http.createServer(app);

// CORS must be first for preflight requests
app.use(cors(corsOptions));

// Handle OPTIONS preflight manually just in case
app.options("*", cors(corsOptions));

const io = new Server(server, { cors: corsOptions });
app.locals.io = io;

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for easier deployment of client/server on same domain
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// API Routes
app.get("/api/health", asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    return res.json({
      success: true,
      message: "Server healthy, but the database is currently unavailable.",
      data: {
        dbReady: false,
        totalUsers: 0,
        adminExists: false,
        gymId: "MAIN"
      }
    });
  }

  const userCount = await User.countDocuments();
  const admin = await User.findOne({ email: "admin@gymza.com", gymId: "MAIN" });
  res.json({ 
    success: true, 
    message: "Server healthy", 
    data: { 
      dbReady: true,
      totalUsers: userCount, 
      adminExists: !!admin,
      gymId: "MAIN"
    } 
  });
}));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/members", require("./routes/member.routes"));
app.use("/api/plans", require("./routes/plan.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/progress", require("./routes/progress.routes"));
app.use("/api/entities", require("./routes/generic.routes"));
app.use("/api/trainers", require("./routes/trainer.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/bookings", require("./routes/booking.routes"));
app.use("/api/referrals", require("./routes/referral.routes"));
app.use("/api/workouts", require("./routes/workout.routes"));
app.use("/api/diets", require("./routes/diet.routes"));
app.use("/api/users", require("./routes/user.routes"));

// Serving client build in production
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  const clientPath = path.join(__dirname, "../client/dist");
  console.log("Serving static files from:", clientPath);
  app.use(express.static(clientPath));
  
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) return res.status(404).json({ success: false, message: "API route not found" });
    res.sendFile(path.resolve(clientPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => res.send("Gym Management API is running. Start client in dev mode or build for production."));
}

io.on("connection", (socket) => {
  const gymId = socket.handshake.query.gymId;
  if (gymId) {
    socket.join(gymId);
    socket.emit("connected", { message: `Joined realtime for gym: ${gymId}` });
  } else {
    socket.emit("connected", { message: "Realtime connected. Join a gym room." });
  }

  socket.on("joinGym", (id) => {
    socket.join(id);
  });
});

app.use(errorHandler);

const startServer = (port, attempt = 1) => {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < 5) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy. Trying ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }

    console.error("Critical server startup error:", error.message);
    process.exit(1);
  });

  server.listen(port, () => console.log(`Server running on :${port}`));
};

const start = async () => {
  try {
    console.log("Environment:", process.env.NODE_ENV || "development");
    console.log("RENDER environment variable:", process.env.RENDER || "false");
    
    const dbReady = await connectDb();
    app.locals.dbReady = dbReady;

    if (dbReady) {
      console.log("Database connection successful");
      // Auto-seed if database is empty
      await seedData();
    } else {
      console.warn("Continuing without database for local development. API routes that depend on MongoDB will return errors until the database is available.");
    }
    
    connectRedis();
    configureCloudinary();
    startExpiryReminderJob();
    
    const port = Number(process.env.PORT || 5000);
    startServer(port);
  } catch (error) {
    console.error("Critical server startup error:", error.message);
    // Log more details if it's a DNS issue
    if (error.code === 'ENOTFOUND') {
      console.error("DNS Resolution failed. Please check your MONGO_URI and internet connection.");
    }
    process.exit(1);
  }
};

start();
