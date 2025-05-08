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
import { weather } from './sources/weather.js';
await convertAllBdfFonts(); // Uses 'bdf' and 'glyphs' directories by default

const frames = [];


const isTomorrowFriday = dayjs().add(1, 'day').day() === 5;

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
  ], 3000)
  
  frames.push.apply(frames, coffeeCup);
}


frames.push.apply(frames, await weather());
frames.push.apply(frames, await time());



  
  
await writeGifToFile(frames, 'clock.gif');
await gifToBin('clock.gif', 'clock.bin');
//await binToGif('clock.bin', 'clockbin.gif');


