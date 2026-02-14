import express from "express";
import cors from 'cors'; // --- IMPORTANT: Import the CORS middleware ---

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // --- IMPORTANT: Backend will run on port 5000 to avoid conflict with React on 3000 ---

const products = [
  { id: 'p1', name: 'Laptop Pro', price: 1200, description: 'High-performance laptop for professionals.' },
  { id: 'p2', name: 'Wireless Mouse', price: 25, description: 'Ergonomic mouse with long battery life.' },
  { id: 'p3', name: 'Mechanical Keyboard', price: 90, description: 'Clicky keys for a satisfying typing experience.' },
  { id: 'p4', name: 'USB-C Hub', price: 40, description: 'Expand your connectivity with multiple ports.' },
];

// --- Middleware ---

app.use(cors());

app.use(express.static("public"));

app.use((req, res, next) => {
  console.log("Custom middleware executed!"); // Log that the middleware ran

  if (req.path === '/about') {
    console.log("Middleware is specifically handling a request to /about (any method).");
    res.send("Request to /about handled directly by middleware.");
  }
  else {
    next();
  }
});



// --- Route Handlers ---

app.get('/', (req, res) => {
  console.log("Route handler for '/' (GET) executed.");
  res.send('GET request to home page successful!');
});

app.post('/about', (req, res) => {
  console.log("Route handler for '/about' (GET) executed.");
  res.send('GET request to about page successful!');
});

app.get('/api/products', (req, res) => {
  console.log('GET /api/products endpoint hit. Sending product data.');
  res.json(products); // Sends the in-memory products data
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Products API endpoint: http://localhost:${PORT}/api/products`);
  console.log(`Remember: Data is in-memory and resets on server restart.`);
});
