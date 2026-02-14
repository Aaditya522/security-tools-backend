// routes/phishingScanner.js
import express from "express";
import whois from "whois-json";
import { parse as parseUrl } from "tldts";
import dns from "dns/promises";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ===================== Gemini Init ===================== //
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log(
  "Gemini API Key:",
  process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing"
);

// 🔥 Use a model that works with v1beta
const GEMINI_MODEL = "gemini-1.5-pro"; 
// If this still fails, try: "gemini-2.0-flash-exp"

// ===================== Heuristic Checks ===================== //
function simpleHeuristics(url, parsedDomain) {
  const checks = [];
  const u = (url || "").toLowerCase();

  if (!/^https?:\/\//i.test(u))
    checks.push({
      name: "invalid_scheme",
      reason: "Missing http(s) scheme",
      score: 50,
    });

  if (/^https?:\/\/\d{1,3}(\.\d{1,3}){3}/.test(u))
    checks.push({
      name: "ip_host",
      reason: "IP address used as hostname",
      score: 40,
    });

  const suspiciousWords = [
    "login","signin","secure","account","update",
    "paypal","ebay","bank","confirm","verify","reset",
  ];

  for (const w of suspiciousWords) {
    if (u.includes(w))
      checks.push({
        name: `suspicious_word_${w}`,
        reason: `Contains "${w}"`,
        score: 8,
      });
  }

  if (u.length > 200)
    checks.push({
      name: "very_long_url",
      reason: "URL length > 200",
      score: 20,
    });

  if (parsedDomain && parsedDomain.includes("xn--"))
    checks.push({
      name: "punycode",
      reason: "Punycode (possible IDN attack)",
      score: 20,
    });

  if (!u.startsWith("https://"))
    checks.push({
      name: "no_https",
      reason: "Not using HTTPS",
      score: 6,
    });

  return checks;
}

// ===================== Main Route ===================== //
router.post("/scan-url", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const parsed = parseUrl(url);
  const domain = parsed?.domain || null;

  const response = {
    url,
    parsed: {
      hostname: parsed.hostname || null,
      domain,
      subdomain: parsed.subdomain || null,
    },
    whois: null,
    heuristics: { checks: [], score: 0 },
    dns: null,
    reasons: [],
    score: 0,
    label: "unknown",
    geminiSuggestion: null,
  };

  const checks = simpleHeuristics(url, parsed.hostname || "");
  response.heuristics.checks = checks;

  // ================= DNS Check ================= //
  if (domain) {
    try {
      await dns.lookup(domain);
      response.dns = { resolved: true };
    } catch {
      checks.push({
        name: "dns_unresolved",
        reason: "Domain does not resolve",
        score: 30,
      });
      response.dns = { resolved: false };
    }
  }

  // ================= WHOIS Lookup ================= //
  if (domain) {
    try {
      const w = await whois(domain, {
        follow: 2,
        timeout: 10000,
      });

      const createdKeys = [
        "creationDate","created","createdDate",
        "domainCreateDate","registered","registeredDate",
      ];

      let created = null;

      for (const k of createdKeys) {
        if (w[k]) {
          created = w[k];
          break;
        }
      }

      let ageDays = null;

      if (created) {
        const d = new Date(created);
        if (!isNaN(d)) {
          ageDays = Math.floor(
            (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      response.whois = {
        raw: w,
        created: created || "N/A",
        ageDays: ageDays ?? "—",
      };

      if (!created)
        checks.push({
          name: "no_whois",
          reason: "WHOIS data unavailable",
          score: 20,
        });
      else if (ageDays !== null && ageDays < 7)
        checks.push({
          name: "new_domain",
          reason: "Domain age < 7 days",
          score: 25,
        });

    } catch (e) {
      console.warn("WHOIS lookup failed:", e.message);
      response.whois = { error: true, msg: e.message };
      checks.push({
        name: "whois_failed",
        reason: "WHOIS lookup failed",
        score: 15,
      });
    }
  }

  // ================= Scoring ================= //
  const finalScore = checks.reduce((s, c) => s + (c.score || 0), 0);
  response.score = finalScore;
  response.heuristics.score = finalScore;

  if (finalScore >= 80) response.label = "phishing";
  else if (finalScore >= 30) response.label = "suspicious";
  else response.label = "safe";

  response.reasons = checks.map((c) => ({
    name: c.name,
    reason: c.reason,
    score: c.score || 0,
  }));

  // ================= GEMINI AI ================= //
  try {
    const prompt = `
You are a cybersecurity assistant.
Give a short (1 sentence) user-friendly suggestion
about whether to open this URL.

URL: ${response.url}
Domain: ${response.parsed.domain}
Domain age (days): ${response.whois?.ageDays}
Score: ${response.score}
Label: ${response.label}
Flags: ${response.reasons.map((r) => r.reason).join(", ")}
`;

    const geminiResult = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    response.geminiSuggestion =
      geminiResult.text?.trim() || "No AI response.";

  } catch (err) {
    console.error("Gemini FULL error:", err.message);
    response.geminiSuggestion = "AI suggestion unavailable.";
  }

  return res.json(response);
});

export default router;