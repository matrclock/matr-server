import { dadJoke } from './sources/dadjoke.js';
import { convertAllBdfFonts } from './convertFonts.js';
import {
    renderTextGif,
    renderScrollingTextGif,
    writeGifToFile,
    renderVerticalScrollingTextGif,
    renderMultilineHorizontalScrollGif
} from './renderGifText.js';
import { catfact } from './sources/catfact.js';
import { timeUntil } from './sources/timeuntil.js';

await convertAllBdfFonts(); // Uses 'bdf' and 'glyphs' directories by default
// Or:
// await convertAllBdfFonts('my-bdf-folder', 'output-folder');

/*
const line1 = await dadJoke();
const line2 = await catfact();

const frames = await renderMultilineHorizontalScrollGif({
    delay: 100,
    lines: [
      { text: line1, fontName: '5x7', y: 6, pixelsPerFrame: 3 },
      { text: line2, fontName: '7x13B', y: 14, pixelsPerFrame: 5 }
    ]
  })
*/

const time = timeUntil('2025-05-03T14:25:00', 'America/Denver');

const frames = await renderTextGif([
  {
    text: 'We need to',
    fontName: '4x6',
    x: 5,
    y: 4
  },
  {
    text: 'leave in',
    fontName: '4x6',
    x: 5,
    y: 10
  },
  {
    text: `${time.hours+6}h ${time.minutes}m`,
    fontName: '6x13B',
    x: 5,
    y: 18
  }]);
  
await writeGifToFile(frames, 'clock.gif');
