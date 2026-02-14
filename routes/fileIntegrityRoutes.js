import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Generate hash (with algorithm support)
router.post("/generate", upload.single("file"), (req, res) => {
  const { algorithm = "sha256" } = req.body; // Default to SHA-256
  const filePath = req.file.path;

  try {
    // Ensure algorithm is supported
    if (!crypto.getHashes().includes(algorithm)) {
      return res.status(400).json({ error: `Unsupported algorithm: ${algorithm}` });
    }

    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => {
      const finalHash = hash.digest("hex");
      fs.unlinkSync(filePath); // delete temp file
      res.json({ hash: finalHash, algorithm });
    });
  } catch (err) {
    console.error("Error generating hash:", err);
    res.status(500).json({ error: "Failed to generate hash" });
  }
});

// Verify hash (with algorithm support)
router.post("/verify", upload.single("file"), (req, res) => {
  const { originalHash, algorithm = "sha256" } = req.body;
  const filePath = req.file.path;

  try {
    if (!crypto.getHashes().includes(algorithm)) {
      return res.status(400).json({ error: `Unsupported algorithm: ${algorithm}` });
    }

    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => {
      const computedHash = hash.digest("hex");
      fs.unlinkSync(filePath);

      res.json({
        match: computedHash === originalHash,
        computedHash,
        algorithm,
      });
    });
  } catch (err) {
    console.error("Error verifying hash:", err);
    res.status(500).json({ error: "Failed to verify file integrity" });
  }
});

export default router;
