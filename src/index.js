import { convertAllBdfFonts } from './convertFonts.js';
import {
    renderTextGif,
    renderScrollingTextGif,
    writeGifToFile,
    renderVerticalScrollingTextGif,
    renderMultilineHorizontalScrollGif
} from './renderGifText.js';

await convertAllBdfFonts(); // Uses 'bdf' and 'glyphs' directories by default
// Or:
// await convertAllBdfFonts('my-bdf-folder', 'output-folder');


const frames = await renderMultilineHorizontalScrollGif({
    delay: 100,
    lines: [
      { text: 'Line One', fontName: '4x6', y: 2, pixelsPerFrame: 2 },
      { text: 'Second Line Here', fontName: '4x6', y: 9, pixelsPerFrame: 4 },
      { text: 'This is line three', fontName: '5x7', y: 16, pixelsPerFrame: 3 },
      { text: 'It fits four of 4x6', fontName: '4x6', y: 24, pixelsPerFrame: 5 }
    ]
  })

  
await writeGifToFile(frames, 'clock.gif');
