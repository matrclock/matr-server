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

await convertAllBdfFonts(); // Uses 'bdf' and 'glyphs' directories by default
// Or:
// await convertAllBdfFonts('my-bdf-folder', 'output-folder');

const line1 = await dadJoke();
const line2 = await catfact();

const frames = await renderMultilineHorizontalScrollGif({
    delay: 100,
    lines: [
      { text: line1, fontName: '4x6', y: 2, pixelsPerFrame: 2 },
      { text: line2, fontName: '4x6', y: 9, pixelsPerFrame: 4 },
      { text: 'from the blog server', fontName: '5x7', y: 16, pixelsPerFrame: 3 },
      { text: 'Something useful would be cool', fontName: '4x6', y: 24, pixelsPerFrame: 5 }
    ]
  })

  
await writeGifToFile(frames, 'clock.gif');
