require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const app = express();
app.set("trust proxy", 1); // Enable for Vercel reversed proxy
// Connect to MongoDB middleware for Serverless
app.use(async (req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    await connectDB();
  }
  next();
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : "http://localhost:5173",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message: "অনুরোধের সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।",
  },
});
app.use("/api/", limiter);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Logger (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/routines", require("./routes/routines"));
app.use("/api/habits", require("./routes/habits"));
app.use("/api/journal", require("./routes/journal"));
app.use("/api/study", require("./routes/study"));
app.use("/api/workout", require("./routes/workout"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/milestones", require("./routes/milestones"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Service is active",
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "সার্ভারে সমস্যা হয়েছে",
  });
});

// 404 handler
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: "এই রাস্তা খুঁজে পাওয়া যায়নি" });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server started on Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

module.exports = app;
