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
import { currentWeather } from './sources/currentWeather.js';
import { emptyframe } from './sources/emptyframe.js';
import { pixlet } from './sources/pixlet.js';
import { trashday } from './sources/trashday.js';
import { todoist } from './sources/todoist.js';
import { daysUntil } from './sources/daysuntil.js';


const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];
const sometimesApps = [
    {app: pixlet('sunrise_sunset'), dwell: 5}, 
    {app: coffeeOutside, dwell: 5},
    {app: trashday, dwell: 5},
    {app: daysUntil({
        date: '2025-07-09',
        text: 'France',
        icon: 'ʟ',
    }), dwell: 5},
    {app: todoist(0,4)},

];

function getApps() {
    return [
        {app: time()}, 
        pickRandom(sometimesApps),
        {app: time()}, 
        {app: currentWeather},
        {app: time()}, 
        {app: weather},  
    ];
}





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

    req.session = session;
    next();
});

app.get('/next', getResponseMethod(getBinData, 'image/png'));
app.get('/nextgif', getResponseMethod(getGifData, 'image/gif'));

function getResponseMethod(dataFn, contentType) {
    return async (req, res) => {
        res.set('Content-Type', contentType);
        const result = await findApp(req.session);
        const frames = await result.app;
        const dwell = result.dwell || await calculateDwell(frames);
        const buffer = await dataFn(frames);
        res.setHeader('matr-dwell', dwell);
        res.send(buffer);   
    }
}

async function findApp(session, counter = 0) {
    const apps = getApps();
    const index = session.requestCount % apps.length;
    const app = await apps[index].app();
    const dwell = apps[index].dwell;

    if (app && app.length === 0) {
        if (counter < apps.length - 1) {
            session.requestCount++;
            return findApp(session, counter + 1);
        } else {
            const app = await emptyframe();
            return {app, dwell: 10};
        }
    } 

    return {app, dwell};
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