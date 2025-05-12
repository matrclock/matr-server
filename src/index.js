import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

import { writeGifToFile, writeBinToFile, getGifData, getBinData, calculateDwell} from './gifWriter.js';
import { convertAllBdfFonts } from './convertFonts.js';
import { loadConfig } from './loadConfig.js';

import { coffeeOutside } from './sources/coffeeoutside.js';
import { time } from './sources/time.js';
import { weather } from './sources/weather.js';
import { renderTextGif } from './renderGifText.js';
import { on } from 'events';

dayjs.extend(utc);
dayjs.extend(timezone);

// Setup directory paths
const distDir = path.join(process.cwd(), 'dist');
const config = await loadConfig();
const sessions = new Map();

// One-time font conversion
await convertAllBdfFonts();

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.static(distDir));
// a middleware with no mount path; gets executed for every request to the app
app.use(function(req, res, next) {
    res.setHeader('matr-time', Math.round(new Date().getTime()/1000))
    next();
});

app.use((req, res, next) => {
    const sessionId = req.headers['matr-id'] || req.ip;
    let session = sessions.get(sessionId);

    if (!session) {
        session = {
            created: Date.now(),
            lastSeen: Date.now(),
            requestCount: 0,
        };
        sessions.set(sessionId, session);
    } else {
        session.lastSeen = Date.now();
        session.requestCount++;
    }

    console.log('SESSION', sessionId, session)
    req.session = session;
    next();
});

app.get('/next', getResponseMethod(getBinData, 'image/png'));
app.get('/nextgif', getResponseMethod(getGifData, 'image/gif'));

function getResponseMethod(dataFn, contentType) {
    return async (req, res) => {
        res.set('Content-Type', contentType);
        const timeMs = req.headers['matr-time'] * 1000 || Date.now();
        const frames = await makeFrames(req.session.requestCount);
        const buffer = await dataFn(frames);
        const dwell = await calculateDwell(frames);
        res.setHeader('matr-dwell', dwell);
        res.send(buffer);   
    }
}

async function makeFrames(requestCount) {
    const frames = [];

    const apps = [];
    const appNames = [weather, time, coffeeOutside];

    for (const app of appNames) {
        const result = await app();
        if (result.length > 0) {
            apps.push(result);
        }
    }

    for (let i = 5; i > 0; i--) {
        const result = await renderTextGif([
            {
                content: 'Next \x039C5A2Dapp\x0F in',
                fontName: 'Tiny5-Regular',
                x: 2,
                y: 1
            },{
                content: String(i),
                fontName: 'profont22',
                x: 2,
                y: 7,
                color: '#4a5b44'
            }], 1000)
        apps.push(result);
    }
    console.log(apps.length)

    const dwellTimes = await Promise.all(apps.map(app => calculateDwell(app)));

    const dwellStartTimes = [0];
    for (const dwell of dwellTimes) {
      dwellStartTimes.push(dwellStartTimes[dwellStartTimes.length - 1] + await dwell);
    }

    const totalDuration = dwellStartTimes[dwellStartTimes.length - 1];
    
    const index = requestCount % apps.length;
    console.log('index', index+1)
    return apps[index];
}

// Content generation function
async function regenerateFiles() {
    const frames = await makeFrames();
  
    await writeGifToFile(frames, path.join(distDir, 'clock.gif'));
    await writeBinToFile(frames, path.join(distDir, 'clock.bin'));
  
    console.log(`[${new Date().toISOString()}] Files regenerated.`);
}

setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessions.entries()) {
        if (now - session.lastSeen > 10 * 60 * 1000) { // 10 minutes idle
            sessions.delete(key);
        }
    }
}, 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});