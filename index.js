const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');  // Install axios to make HTTP requests

const app = express();
const port = 3000;

// Middleware to parse incoming JSON payloads
app.use(bodyParser.json());

// Define a route to handle the webhook
app.post('/webhook', async (req, res) => {
    // Extract the data from the request body
    const data = req.body;

    // Log the received data (optional)
    console.log('Received webhook data:', data);

    try {
        // Send the received data to the n8n webhook URL
        const n8nWebhookUrl = 'https://musipex.app.n8n.cloud/webhook/f8158f83-ea38-4184-aa46-6a8e947720a6';
        const response = await axios.post(n8nWebhookUrl, data);

        // Log the response from n8n (optional)
        console.log('n8n response:', response.data);

        // Respond back to the original request with the same data
        res.status(200).json(data);
    } catch (error) {
        // Handle error if request to n8n fails
        console.error('Error sending to n8n:', error);
        res.status(500).send('Error sending data to n8n');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
