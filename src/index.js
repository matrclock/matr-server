import { dadJoke } from './sources/dadjoke.js';
import {
    renderTextGif,
    renderScrollingTextGif,
    writeGifToFile,
    renderVerticalScrollingTextGif,
    renderMultilineHorizontalScrollGif,
    gifToBin,
    binToGif
} from './renderGifText.js';
import { catfact } from './sources/catfact.js';
import { timeUntil } from './sources/timeuntil.js';
import { fococount } from './sources/fococount.js';
import { time } from './sources/time.js';

//import { convertAllBdfFonts } from './convertFonts.js';
//await convertAllBdfFonts(); // Uses 'bdf' and 'glyphs' directories by default

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

const timetil = timeUntil('2025-05-03T14:25:00', 'America/Denver');


const frames = [];

frames.push.apply(frames, await renderVerticalScrollingTextGif({
  text: await catfact(),
  fontName: '6x9',
  lineSpacing: 2,
  delay: 50,
  pixelsPerFrame: 1
}));

/*
frames.push(await renderTextGif([
  {
    text: 'The time is',
    fontName: '4x6',
    x: 5,
    y: 7
  },
  {
    text: time(),
    fontName: '9x15B',
    x: 5,
    y: 16
  }], 5000));
  */
  
await writeGifToFile(frames, 'clock.gif');
await gifToBin('clock.gif', 'clock.bin');
await binToGif('clock.bin', 'clockbin.gif');


