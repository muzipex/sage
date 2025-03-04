require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('Gemini API Key is missing! Set GEMINI_API_KEY in your .env file.');
}

const db = new sqlite3.Database('./search_queries.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS search_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      result TEXT NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
      } else {
        console.log("Table 'search_queries' is ready.");
      }
    }
  );
});

async function getAiResponse(query) {
  try {
    // Updated endpoint and payload for Gemini 2.0 Pro
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-pro:generateContent",
      {
        // Updated payload structure
        contents: [
          { role: "user", parts: [{ text: query }] }
        ]
      },
      {
        params: { key: GEMINI_API_KEY },
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      // Adjust extraction based on the expected response structure
      return response.data.candidates[0].content.parts[0].text;
    } else {
      return "AI response not found.";
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    if (error.response) {
      console.error("Gemini API response data:", error.response.data);
      console.error("Gemini API response status:", error.response.status);
      console.error("Gemini API response headers:", error.response.headers);
    }
    return `Error fetching AI response: ${error.message}`;
  }
}

app.post('/api/chat/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const aiResponse = await getAiResponse(message);

    db.run(
      `INSERT INTO search_queries (query, result) VALUES (?, ?)`,
      [message, aiResponse],
      function (err) {
        if (err) {
          console.error("Database insert error:", err.message);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ reply: aiResponse });
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Error processing the request." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
