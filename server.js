const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for Claude API
app.post('/api/claude', async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(400).json({ error: 'API key required' });
    }

    try {
        const fetch = (await import('node-fetch')).default;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: {
                message: error.message || 'Proxy server error'
            }
        });
    }
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📊 Performance Dashboard Proxy Server                   ║
║                                                            ║
║   Server running on: http://localhost:${PORT}                 ║
║                                                            ║
║   Open your browser and go to:                            ║
║   → http://localhost:${PORT}/index.html                       ║
║                                                            ║
║   Press Ctrl+C to stop the server                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});
