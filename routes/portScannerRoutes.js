import express from "express";
const router = express.Router();

import net from "net";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

import portInfo from "../portInfo.js";

// Initialize Gemini (NEW SDK FORMAT)
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log(
  "Gemini API Key:",
  process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing"
);

// ================= Port Scanner =================
function scanPort(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = "closed";

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      status = "open";
      socket.destroy();
    });

    socket.on("timeout", () => socket.destroy());
    socket.on("error", () => (status = "closed"));
    socket.on("close", () => resolve({ port, status }));

    socket.connect(port, host);
  });
}

// ================= Route =================
router.post("/scan", async (req, res) => {
  const { host, startPort, endPort } = req.body;

  if (!host || startPort == null || endPort == null) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const tasks = [];

  for (let port = startPort; port <= endPort; port++) {
    tasks.push(scanPort(host, port));
  }

  const results = await Promise.all(tasks);
  const openPorts = results.filter((r) => r.status === "open");

  for (const p of openPorts) {
    p.purpose = portInfo[p.port] || portInfo.default;

    // If no predefined info, ask Gemini
    if (p.purpose === portInfo.default) {
      try {
        const prompt = `
For TCP port ${p.port}, explain:

- What this port is generally used for.
- Why an attacker might scan or target this port.
- Risk level (Low, Medium, High) with justification.

Keep response under 130 words.
If risk is high, suggest protection measures.
`;

        const result = await genAI.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
        });

        const aiText =
          "Gemini Suggestion: " +
          (result.text?.trim() || "No AI response.");

        p.purpose = aiText;

      } catch (err) {
        console.error("Gemini FULL error:", err);
        p.purpose = "AI suggestion unavailable.";
      }
    }
  }

  res.json({ openPorts });
});

export default router;
