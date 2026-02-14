import express from "express";
import axios from "axios";

const router = express.Router();

// GET /api/keylogger-check
router.get("/", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:7000/check-keylogger");
    res.json(response.data);
  } catch (err) {
    console.error("Error contacting Python service:", err.message);
    res.status(500).json({ error: "Python service unavailable" });
  }
});

export default router;
