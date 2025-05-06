import { dadJoke } from './sources/dadjoke.js';
import {
    renderTextGif,
    renderHorizontalScrollingTextGif,
    renderVerticalScrollingTextGif,
    renderMultilineHorizontalScrollGif,
    TextContent
} from './renderGifText.js';
import { binToGif, gifToBin, writeGifToFile } from './gifWriter.js';
import { catfact } from './sources/catfact.js';
import { timeUntil } from './sources/timeuntil.js';
import { fococount } from './sources/fococount.js';
import { time } from './sources/time.js';

import { convertAllBdfFonts } from './convertFonts.js';
await convertAllBdfFonts(); // Uses 'bdf' and 'glyphs' directories by default

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

const frames = [];


const textItem = new TextContent({
  content: await catfact(),
  fontName: "Tiny5-Bold", // Replace with your actual font JSON name (without .json)
  x: 0,
  y: 0,
  color: "#333",
  lineSpacing: 0
});



frames.push.apply(frames, await renderVerticalScrollingTextGif(textItem, {
  delay: 70,
  pixelsPerFrame: 1,
}));


/*
frames.push(await renderTextGif([
  {
    content: 'The time is',
    fontName: 'Tiny5-Regular',
    x: 5,
    y: 7
  },
  {
    content: time(),
    fontName: '6x13B',
    x: 5,
    y: 16
  }], 1000));
*/

/*
frames.push(await renderTextGif([
  {
    content: 'byjipq',
    fontName: 'Tiny5-Regular',
    x: 1,
    y: 2
  },
  {
    content: 'bqrstuvwxyz',
    fontName: 'Tiny5-Regular',
    x: 1,
    y: 12
  },
  {
    content: 'ABCDEFGHIJKLM',
    fontName: 'Tiny5-Regular',
    x: 1,
    y: 22
  }
], 1000));
*/  
  
await writeGifToFile(frames, 'clock.gif');
await gifToBin('clock.gif', 'clock.bin');
//await binToGif('clock.bin', 'clockbin.gif');


