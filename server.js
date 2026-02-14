import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import fileIntegrityRoutes from "./routes/fileIntegrityRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import keyloggerRoutes from "./routes/keyloggerRoutes.js";
import phishingScannerRouter from "./routes/phishingScanner.js";
import portScannerRoutes from "./routes/portScannerRoutes.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();

// app.use(cors());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI);

// Sessions

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  }
});

app.use(sessionMiddleware);


// Root test route
app.get("/", (req, res) => res.send("Server is running."));

// Auth routes
app.use("/api/auth", authRoutes);

// Rest Routes
app.use("/api/file-integrity",fileIntegrityRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/keylogger-check", keyloggerRoutes);
app.use("/api", phishingScannerRouter);
app.use("/api/port-scan", portScannerRoutes);


app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://localhost:5000");
});

// app.listen(5000,'0.0.0.0', () => console.log("Server running on http://localhost:5000"));