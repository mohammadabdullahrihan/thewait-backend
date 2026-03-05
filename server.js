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
    origin: [
      "http://localhost:5173",
      "https://thewait.netlify.app",
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
    ],
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

// Root landing page for the API
app.get("/", (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Wait | Backend Engine</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; }
    h1 { font-family: 'Montserrat', sans-serif; }
    .glow { box-shadow: 0 0 50px rgba(34, 197, 94, 0.15); }
    .bg-grid { background-image: radial-gradient(rgba(34, 197, 94, 0.15) 1px, transparent 1px); background-size: 32px 32px; }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
  <div class="absolute inset-0 bg-grid opacity-60"></div>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px] -z-10"></div>
  
  <div class="max-w-2xl w-full bg-slate-800/40 backdrop-blur-2xl border border-slate-700/50 p-10 md:p-14 rounded-[32px] text-center glow relative z-10 transition-transform duration-500 hover:scale-[1.01]">
    
    <div class="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl mx-auto flex items-center justify-center border border-green-500/30 mb-8 shadow-inner">
      <span class="text-4xl drop-shadow-md">⚔️</span>
    </div>
    
    <h1 class="text-4xl md:text-5xl font-black mb-5 bg-gradient-to-r from-white via-green-300 to-emerald-500 bg-clip-text text-transparent">
      The Wait Engine
    </h1>
    
    <p class="text-slate-400 text-lg md:text-xl font-medium mb-12">
      Backend API is actively shielding your discipline and growth.
    </p>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-semibold text-slate-300">
      <div class="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors hover:border-green-500/30">
        <span class="text-green-400 mb-1 text-xs uppercase tracking-wider">Status</span>
        <span class="text-white text-base">Active</span>
      </div>
      <div class="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors hover:border-green-500/30">
        <span class="text-green-400 mb-1 text-xs uppercase tracking-wider">Version</span>
        <span class="text-white text-base">1.0.0</span>
      </div>
      <div class="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors hover:border-green-500/30">
        <span class="text-green-400 mb-1 text-xs uppercase tracking-wider">Environment</span>
        <span class="text-white text-base">Production</span>
      </div>
      <div class="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors hover:border-green-500/30">
        <span class="text-green-400 mb-1 text-xs uppercase tracking-wider">Database</span>
        <span class="text-white text-base">MongoDB</span>
      </div>
    </div>
    
    <div class="mt-12 pt-8 border-t border-slate-700/50">
      <a href="/api/health" class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-slate-900 rounded-2xl font-bold transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
        Initialize Health Check
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </a>
    </div>
  </div>
</body>
</html>`;
  res.send(html);
});

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
