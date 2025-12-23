const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./routes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    next();
});

// API Routes
app.get('/api/config', (req, res) => {
    res.json({ ip: getLocalIp(), port: 3000 });
});
app.use('/api', router);

// Serve Frontend (Production Ready) - Optional for now, but good to have setup
// When built, client/dist will contain the static files
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

// Keep process alive just in case
setInterval(() => { }, 10000);
