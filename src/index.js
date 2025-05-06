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
import dayjs from 'dayjs';

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


/*
const textItem = new TextContent({
  content: await catfact(),
  fontName: "Tiny5-Regular", // Replace with your actual font JSON name (without .json)
  x: 0,
  y: 0,
  color: "#333",
  lineSpacing: -7
});


frames.push.apply(frames, await renderVerticalScrollingTextGif(textItem, {
  delay: 70,
  pixelsPerFrame: 1,
}));
*/



frames.push(await renderTextGif([
  {
    content: 'The time is',
    fontName: 'Tiny5-Regular',
    x: 5,
    y: 3
  },
  {
    content: time(),
    fontName: '9x18B',
    x: 5,
    y: 9
  }], 5000));

const bikes = await fococount(dayjs().subtract(1, 'day').format('YYYYMMDD'), 4);

frames.push(await renderTextGif([
  {
    content: 'Remington bikes',
    fontName: 'Tiny5-Regular',
    x: 2,
    y: 1
  },
  {
    content: 'yesterday',
    fontName: 'Tiny5-Regular',
    x: 2,
    y: 7
  },
  {
    content: String(bikes),
    fontName: '9x18B',
    x: 2,
    y: 13
  }], 5000));


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


