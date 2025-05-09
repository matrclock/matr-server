import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import fs from 'fs';

import {
    renderTextGif,
    renderHorizontalScrollingTextGif,
    renderVerticalScrollingTextGif,
    renderMultilineHorizontalScrollGif,
    TextContent
} from './renderGifText.js';
import { gifToBin, writeGifToFile } from './gifWriter.js';
import { time } from './sources/time.js';
import { weather } from './sources/weather.js';
import { convertAllBdfFonts } from './convertFonts.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Setup directory paths
const distDir = path.join(process.cwd(), 'dist');

// One-time font conversion
await convertAllBdfFonts();

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.static(distDir));

async function makeFrames() {
  const frames = [];
  const tz = "America/Denver";
  const isTomorrowFriday = dayjs.utc().tz(tz).add(1, 'day').day() === 5;

  if (isTomorrowFriday) {
      const yOffset = 3;
      const coffeeCup = await renderTextGif([
          {
              content: 'Ć',
              fontName: 'streamline_all',
              x: -1,
              y: 5,
              color: '#6F4E37'
          },
          {
              content: 'tomorrow is',
              fontName: 'Tiny5-Regular',
              x: 21,
              y: yOffset
          },
          {
              content: 'coffee',
              fontName: 'Tiny5-Regular',
              x: 21,
              y: yOffset + 8,
              color: '#4a5b44'
          },
          {
              content: 'outside',
              fontName: 'Tiny5-Regular',
              x: 21,
              y: yOffset + 16
          }
      ], 5000);
      frames.push(...coffeeCup);
  }

  frames.push(...await weather());
  frames.push(...await time());
  return frames;
}

// Content generation function
async function regenerateFiles() {
    const frames = await makeFrames();
  
    await writeGifToFile(frames, path.join(distDir, 'clock.gif'));
    await gifToBin(path.join(distDir, 'clock.gif'), path.join(distDir, 'clock.bin'));
  
    console.log(`[${new Date().toISOString()}] Files regenerated.`);
  }
  
  // Clock endpoint (dynamically serve JSON)
  app.get('/clock.json', (req, res) => {
    const clockData = {
      time: dayjs.utc().tz("America/Denver").format()
    };
    res.json(clockData);
  });

// Run immediately on startup
await regenerateFiles();

// Re-run every 60 seconds
setInterval(regenerateFiles, 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});