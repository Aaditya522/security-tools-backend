import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/authRoutes.js";
import fileIntegrityRoutes from "./routes/fileIntegrityRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import keyloggerRoutes from "./routes/keyloggerRoutes.js";
import phishingScannerRouter from "./routes/phishingScanner.js";
import portScannerRoutes from "./routes/portScannerRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB Connection

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });


// Health check
app.get("/", (req, res) => {
  res.send("Security Tools Backend Running");
});

// Auth
app.use("/api/auth", authRoutes);

// Other Tools
app.use("/api/file-integrity", fileIntegrityRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/keylogger-check", keyloggerRoutes);
app.use("/api", phishingScannerRouter);
app.use("/api/port-scan", portScannerRoutes);


app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ======================
// Start Server
// ======================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
