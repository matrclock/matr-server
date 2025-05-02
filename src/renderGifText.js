import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GifCodec, GifFrame, BitmapImage } from 'gifwrap';
import pureimage from 'pureimage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKGROUND_COLOR = 'black';
const FOREGROUND_COLOR = 'darkgrey';

async function loadFont(fontName) {
  const fontPath = path.join(__dirname, 'glyphs', `${fontName}.json`);
  const data = await fs.promises.readFile(fontPath, 'utf-8');
  return JSON.parse(data);
}

function drawText(ctx, font, text, x, y) {
    let cursorX = x;
    for (const ch of text) {
        const glyph = font[ch];
        if (!glyph) {
        cursorX += 4;
        continue;
        }

        const xOffset = glyph.xOffset || 0;
        const yOffset = glyph.yOffset || 0;

        for (let row = 0; row < glyph.bitmap.length; row++) {
        for (let col = 0; col < glyph.bitmap[row].length; col++) {
            if (glyph.bitmap[row][col]) {
            ctx.fillRect(cursorX + col + xOffset, y + row + yOffset, 1, 1);
            }
        }
        }

        const advance = glyph.width + xOffset + 1;
        cursorX += advance;
    }
}

export async function renderTextGif(input) {
  const items = Array.isArray(input) ? input : [input];
  const fontCache = {};

  const img = pureimage.make(64, 32);
  const ctx = img.getContext('2d');
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, 64, 32);

  for (const { text, fontName, x = 0, y = 0 } of items) {
    if (!fontCache[fontName]) {
      fontCache[fontName] = await loadFont(fontName);
    }
    ctx.fillStyle = FOREGROUND_COLOR;
    drawText(ctx, fontCache[fontName], text, x, y);
  }

  const bmp = new BitmapImage({ width: 64, height: 32, data: Buffer.from(img.data) });
  return new GifFrame(bmp, { delayCentisecs: 1000 });
}

export async function renderScrollingTextGif({
    text,
    fontName,
    y = 0,
    delay = 100,
    pixelsPerFrame = 1
  }) {
    const font = await loadFont(fontName);
  
    // Calculate total pixel width of the text
    let textWidth = 0;
    for (const ch of text) {
      const glyph = font[ch];
      textWidth += glyph ? glyph.width + 1 : 4;
    }
  
    const totalPixels = textWidth + 64;
    const totalFrames = Math.ceil(totalPixels / pixelsPerFrame);
    const frames = [];
  
    for (let i = 0; i < totalFrames; i++) {
      const offset = i * pixelsPerFrame;
      const img = pureimage.make(64, 32);
      const ctx = img.getContext('2d');
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = FOREGROUND_COLOR;
      drawText(ctx, font, text, 64 - offset, y);
      const bmp = new BitmapImage({ width: 64, height: 32, data: Buffer.from(img.data) });
      frames.push(new GifFrame(bmp, { delayCentisecs: Math.round(delay / 10) }));
    }
  
    return frames;
  }

  export async function renderVerticalScrollingTextGif({
    text,
    fontName,
    delay = 100,
    pixelsPerFrame = 1,
    lineSpacing = 1
  }) {
    const font = await loadFont(fontName);
    const glyphHeight = Math.max(...Object.values(font).map(g => g.height + (g.yOffset || 0)));
    const maxWidth = 64;
  
    // Word-aware wrapping with hyphenation for long words
    const lines = [];
    let currentLine = '';
    let currentWidth = 0;
  
    const words = text.split(/(\s+)/); // split into words and spaces
  
    for (const word of words) {
      let wordWidth = 0;
      for (const ch of word) {
        const glyph = font[ch];
        wordWidth += glyph ? glyph.width + 1 : 4;
      }
  
      if (wordWidth <= maxWidth) {
        if (currentWidth + wordWidth > maxWidth && currentLine) {
          lines.push(currentLine.trim());
          currentLine = word.trimStart();
          currentWidth = 0;
          for (const ch of currentLine) {
            const glyph = font[ch];
            currentWidth += glyph ? glyph.width + 1 : 4;
          }
        } else {
          currentLine += word;
          currentWidth += wordWidth;
        }
      } else {
        // Word too long – split with hyphenation
        for (let i = 0; i < word.length;) {
          let part = '';
          let partWidth = 0;
  
          while (i < word.length) {
            const ch = word[i];
            const glyph = font[ch];
            const chWidth = glyph ? glyph.width + 1 : 4;
            if (partWidth + chWidth > maxWidth - 5) break; // leave space for '-'
            part += ch;
            partWidth += chWidth;
            i++;
          }
  
          const needsHyphen = i < word.length;
          if (needsHyphen) {
            part += '-';
            partWidth += font['-'] ? font['-'].width + 1 : 4;
          }
  
          if (currentWidth + partWidth > maxWidth && currentLine) {
            lines.push(currentLine.trim());
            currentLine = part;
            currentWidth = partWidth;
          } else {
            currentLine += part;
            currentWidth += partWidth;
          }
  
          if (currentWidth >= maxWidth || needsHyphen) {
            lines.push(currentLine.trim());
            currentLine = '';
            currentWidth = 0;
          }
        }
      }
    }
  
    if (currentLine) lines.push(currentLine.trim());
  
    // Generate frames
    const totalHeight = lines.length * (glyphHeight + lineSpacing);
    const totalFrames = Math.ceil((totalHeight + 32) / pixelsPerFrame);
    const frames = [];
  
    for (let i = 0; i < totalFrames; i++) {
      const offset = i * pixelsPerFrame;
      const img = pureimage.make(64, 32);
      const ctx = img.getContext('2d');
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = FOREGROUND_COLOR;
  
      lines.forEach((line, idx) => {
        const yPos = 32 - offset + idx * (glyphHeight + lineSpacing);
        drawText(ctx, font, line, 0, yPos);
      });
  
      const bmp = new BitmapImage({ width: 64, height: 32, data: Buffer.from(img.data) });
      frames.push(new GifFrame(bmp, { delayCentisecs: Math.round(delay / 10) }));
    }
  
    return frames;
  }

  export async function renderMultilineHorizontalScrollGif({
    lines,
    delay = 100
  }) {
    // Load fonts only once per unique fontName
    const fontMap = {};
    for (const line of lines) {
      if (!fontMap[line.fontName]) {
        fontMap[line.fontName] = await loadFont(line.fontName);
      }
    }
  
    // Calculate the total number of frames needed
    // Each line scrolls independently, but we must generate enough frames
    // for the slowest-scrolling line to fully scroll offscreen
    const totalFrameCounts = lines.map(({ text, fontName, pixelsPerFrame }) => {
      const font = fontMap[fontName];
      let textWidth = 0;
      for (const ch of text) {
        const glyph = font[ch];
        textWidth += glyph ? glyph.width + 1 : 4;
      }
      const totalPixels = textWidth + 64;
      return Math.ceil(totalPixels / pixelsPerFrame);
    });
  
    const totalFrames = Math.max(...totalFrameCounts);
    const frames = [];
  
    for (let i = 0; i < totalFrames; i++) {
      const img = pureimage.make(64, 32);
      const ctx = img.getContext('2d');
      ctx.fillStyle = BACKGROUND_COLOR;
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = FOREGROUND_COLOR;
  
      for (const line of lines) {
        const { text, fontName, y = 0, pixelsPerFrame = 1 } = line;
        const font = fontMap[fontName];
        const offset = i * pixelsPerFrame;
        drawText(ctx, font, text, 64 - offset, y);
      }
  
      const bmp = new BitmapImage({ width: 64, height: 32, data: Buffer.from(img.data) });
      frames.push(new GifFrame(bmp, { delayCentisecs: Math.round(delay / 10) }));
    }
  
    return frames;
  }
  

export async function writeGifToFile(frames, filename) {
  const codec = new GifCodec();
  const frameArray = Array.isArray(frames) ? frames : [frames];
  const { buffer } = await codec.encodeGif(frameArray, { loops: 0 });
  const outDir = path.join(__dirname, 'dist');
  await fs.promises.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  await fs.promises.writeFile(outPath, buffer);
  console.log(`✅ Saved ${outPath}`);
}