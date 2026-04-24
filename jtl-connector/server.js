require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuration from .env
const JTL_AMEISE_PATH = process.env.JTL_AMEISE_PATH || 'C:\\Program Files (x86)\\JTL-Software\\JTL-Ameise.exe';
const JTL_EXPORT_TEMPLATE = process.env.JTL_EXPORT_TEMPLATE || 'WebExport';
const DB_SERVER = process.env.DB_SERVER || '(local)\\JTLWAWI';
const DB_NAME = process.env.DB_NAME || 'eazybusiness';
const DB_USER = process.env.DB_USER || 'sa';
const DB_PASS = process.env.DB_PASS || 'sa04jtl';
const API_KEY = process.env.API_KEY || 'ILOVECSSandWebDesign69420';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300000'); // Default 5 minutes

const EXPORT_FILE = path.join(__dirname, 'export.csv');

// State management
let isSyncing = false;
let lastResult = null;
let lastSyncTime = 0;

// Auth Middleware
const auth = (req, res, next) => {
    const providedKey = req.headers['x-api-key'] || req.query.api_key;
    if (providedKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        system: 'JTL-Connector v1.1',
        lastSync: lastSyncTime ? new Date(lastSyncTime).toISOString() : 'Never',
        syncing: isSyncing
    });
});

app.get('/sync', auth, (req, res) => {
    const now = Date.now();

    // 1. Return cached result if valid
    if (lastResult && (now - lastSyncTime < CACHE_TTL)) {
        console.log('Returning cached result');
        return res.json({ ...lastResult, cached: true });
    }

    // 2. Prevent concurrent execution
    if (isSyncing) {
        return res.status(429).json({ error: 'Sync already in progress. Please wait.' });
    }

    console.log('Sync requested...');
    isSyncing = true;

    // Command to run JTL-Ameise
    // We quote everything to prevent injection/path issues
    const command = `"${JTL_AMEISE_PATH}" -s "${DB_SERVER}" -d "${DB_NAME}" -u "${DB_USER}" -p "${DB_PASS}" -t "${JTL_EXPORT_TEMPLATE}" -o "${EXPORT_FILE}"`;

    exec(command, (error, stdout, stderr) => {
        isSyncing = false;

        if (error) {
            console.error(`Export Error: ${error.message}`);
            return res.status(500).json({ error: 'JTL-Ameise export failed', details: error.message });
        }

        try {
            if (!fs.existsSync(EXPORT_FILE)) {
                throw new Error("Export file was not created by JTL-Ameise.");
            }

            const fileContent = fs.readFileSync(EXPORT_FILE, 'utf-8');
            const records = parse(fileContent, {
                columns: true,
                delimiter: ';',
                skip_empty_lines: true
            });

            // Clean up to keep data relevant
            const cleanedData = records.map(r => ({
                ArtNr: r.ArtNr || r['Artikelnummer'] || r['Artikel-Nr.'],
                Name: r.Name || r['Artikelname'],
                Preis: r.Preis || r['VK Brutto'] || r['VK Netto']
            }));

            lastResult = {
                success: true,
                timestamp: new Date().toISOString(),
                count: cleanedData.length,
                products: cleanedData
            };
            lastSyncTime = now;

            res.json(lastResult);
        } catch (parseError) {
            console.error(`Parsing Error: ${parseError.message}`);
            res.status(500).json({ error: 'Failed to parse export data', details: parseError.message });
        }
    });
});

app.listen(port, () => {
    console.log(`JTL-Connector listening at http://localhost:${port}`);
    console.log(`Security: API_KEY is ${API_KEY === 'secret-token-123' ? 'using DEFAULT (Please change!)' : 'SET'}`);
});
