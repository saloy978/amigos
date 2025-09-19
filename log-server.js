import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const LOG_FILE = path.join(__dirname, 'browser-logs.txt');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

// Log endpoint
app.post('/log', (req, res) => {
  const { level, message, timestamp, source, data } = req.body;
  
  const logEntry = {
    timestamp: timestamp || new Date().toISOString(),
    level: level || 'info',
    source: source || 'browser',
    message: message || '',
    data: data || null
  };
  
  const logLine = `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()} [${logEntry.source}]: ${logEntry.message}${logEntry.data ? ' | Data: ' + JSON.stringify(logEntry.data) : ''}\n`;
  
  // Write to file
  fs.appendFileSync(LOG_FILE, logLine);
  
  // Also log to console
  console.log(logLine.trim());
  
  res.json({ success: true });
});

// Get logs endpoint
app.get('/logs', (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    res.json({ logs: logs.split('\n').filter(line => line.trim()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear logs endpoint
app.delete('/logs', (req, res) => {
  try {
    fs.writeFileSync(LOG_FILE, '');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Log server running on http://localhost:${PORT}`);
  console.log(`Log file: ${LOG_FILE}`);
});
