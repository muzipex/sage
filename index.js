require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express app
const app = express();
app.use(cors()); // Allow CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies

// Retrieve Gemini API Key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('Gemini API Key is missing! Set GEMINI_API_KEY in your .env file.');
}

// --- SQLite Database Setup --- //

// Connect to SQLite database (or create if it doesn't exist)
const db = new sqlite3.Database('./search_queries.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS search_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      result TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Table 'search_queries' is ready.");
    }
  });
});

const axios = require('axios');

// Function to get AI response from Gemini API
async function getAiResponse(query) {
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
      {
        contents: [{ parts: [{ text: query }] }],
      },
      {
        params: { key: process.env.GEMINI_API_KEY }, // Your API key from .env
        headers: { "Content-Type": "application/json" },
      }
    );

    // Extract AI-generated response
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      return "AI response not found.";
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return `Error fetching AI response: ${error.message}`;
  }
}

// Primary chat endpoint that generates an AI response and saves the query to the database
app.post('/api/chat/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    
    // Get AI response (replace with your Gemini API integration if needed)
    const aiResponse = await getAiResponse(message);
    
    // Save query and response to the database
    db.run(
      `INSERT INTO search_queries (query, result) VALUES (?, ?)`,
      [message, aiResponse],
      function (err) {
        if (err) {
          console.error("Database insert error:", err.message);
          return res.status(500).json({ error: "Database error" });
        }
        // Return the response to the client
        res.json({ reply: aiResponse });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Error processing the request." });
  }
});

// Additional endpoint for testing (echoes the received message)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  res.json({ response: `You said: ${message}` });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
