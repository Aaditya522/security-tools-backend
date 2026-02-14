import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const router = express.Router();


//GENERATE Password
router.post("/generate", (req, res) => {
  try {
    let { length, keyword } = req.body;
    length = parseInt(length);

    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";

    // Adjust password length if keyword is given
    const randomPartLength = keyword
      ? Math.max(0, length - keyword.length)
      : length;

    for (let i = 0; i < randomPartLength; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    // Randomly insert the keyword into the password
    if (keyword) {
      const insertPos = crypto.randomInt(0, password.length + 1);
      password = password.slice(0, insertPos) + keyword + password.slice(insertPos);
    }

    res.json({ password });
  } catch (err) {
    console.error("Password generation error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

//HIBP Verification
router.post("/check", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password required" });

    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const body = await response.text();

    const found = body.split("\n").some(line => line.split(":")[0] === suffix);

    res.json({ compromised: found });
  } catch (err) {
    console.error("Password check error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
