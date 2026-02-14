# 🔐 Security Tools Backend (Express.js)

A Node.js + Express backend providing multiple cybersecurity utilities including authentication, phishing detection, port scanning, password analysis, file integrity verification, and AI-powered security insights using Google Gemini.

---

## 🚀 Features

### 🔑 1. Authentication System
- User Registration (bcrypt password hashing)
- User Login (JWT-based authentication)
- Secure HTTP-only cookies
- Logout functionality
- Protected route verification (`/me`)
- 1-day JWT expiration

---

### 🌐 2. Phishing URL Scanner
- URL validation (http/https check)
- Heuristic risk scoring
- Suspicious keyword detection
- IP-based hostname detection
- Long URL detection
- HTTPS enforcement check
- Punycode (IDN homograph attack) detection
- DNS resolution verification
- WHOIS domain lookup
- Domain age calculation
- Risk classification (Safe / Suspicious / Phishing)
- AI-generated security suggestion using Google Gemini

---

### 🔎 3. TCP Port Scanner
- Scans custom port ranges
- Detects open TCP ports
- Built-in common port information
- AI-generated explanation for unknown ports
- Risk assessment suggestions via Gemini AI

---

### 🔐 4. Password Security Tools
#### Password Generator
- Custom length support
- Optional keyword insertion
- Secure randomness using `crypto.randomInt`

#### Breach Check (HIBP API)
- SHA-1 hashing
- Checks against HaveIBeenPwned API
- Detects compromised passwords

---

### 🧾 5. File Integrity & Hashing Tool
- Generate hash from uploaded file
- Supports multiple hashing algorithms
- Verify file integrity
- Streaming-based hashing (efficient for large files)
- Temporary file cleanup

---

### 🖥 6. Keylogger Detection (Python Service Integration)
- Communicates with external Python service
- Checks for possible keylogger activity
- Service health verification

---

## 🧠 AI Integration

- Google Gemini API (`@google/genai`)
- Used in:
  - Phishing scanner (risk suggestion)
  - Port scanner (security explanation)
- Model: `gemini-1.5-pro`

---

## 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcryptjs
- Multer (file uploads)
- WHOIS Lookup
- DNS validation
- Google Gemini AI
- HaveIBeenPwned API






