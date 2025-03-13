require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

const N8N_WEBHOOK_URL = "https://musipex.app.n8n.cloud/webhook-test/f8158f83-ea38-4184-aa46-6a8e947720a6";

app.post('/api/n8n-trigger', async (req, res) => {
  try {
    const response = await axios.post(
      N8N_WEBHOOK_URL,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("n8n Webhook error:", error);
    res.status(500).json({ error: "Error triggering n8n workflow." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
