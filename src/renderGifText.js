import fs from 'fs';
import path from 'path';
import { GifFrame, BitmapImage } from 'gifwrap';
import pureimage from 'pureimage';

const srcDir = path.join(process.cwd(), 'src');
const distDir = path.join(process.cwd(), 'dist');

const DEFAULT_BG = '#000';
const DEFAULT_FG = '#666';

class TextContent {
  constructor({
    content,
    fontName,
    x = 0,
    y = 0,
    color = null,
    lineSpacing = 1
  }) {
    this.content = content;
    this.fontName = fontName;
    this.x = x;
    this.y = y;
    this.color = color;
    this.lineSpacing = lineSpacing;
  }
}

async function loadFont(fontName) {
  const fontPath = path.join(srcDir, 'glyphs', `${fontName}.json`);
  const data = await fs.promises.readFile(fontPath, 'utf-8');
  return JSON.parse(data);
}

const fontCache = {};

async function drawText(ctx, textItem) {
  const { fontName, content, x, y, color } = textItem;
  if (!fontCache[fontName]) fontCache[fontName] = await loadFont(fontName);
  const font = fontCache[fontName];

  ctx.fillStyle = color || DEFAULT_FG; // Always use global default color
  let cursorX = x;

  for (const ch of content) {
    const glyph = font[ch];
    if (!glyph) {
      cursorX += 4;
      continue;
    }

    const xOffset = glyph.xOffset || 0;

    for (let row = 0; row < glyph.bitmap.length; row++) {
      for (let col = 0; col < glyph.bitmap[row].length; col++) {
        if (glyph.bitmap[row][col]) {
          ctx.fillRect(cursorX + col + xOffset, y + row, 1, 1);
        }
      }
    }

    cursorX += glyph.width + xOffset + 1;
  }
}

function clearCanvas(ctx, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 64, 32);
}

function makeGifFrame(img, delay) {
  const bmp = new BitmapImage({ width: 64, height: 32, data: Buffer.from(img.data) });
  return new GifFrame(bmp, { delayCentisecs: Math.round(delay / 10) });
}

export async function renderTextGif(textItems, delay = 1000, { backgroundColor = DEFAULT_BG } = {}) {
  const img = pureimage.make(64, 32);
  const ctx = img.getContext('2d');
  clearCanvas(ctx, backgroundColor);

  for (const item of textItems) {
    await drawText(ctx, item); // No longer passing defaultColor
  }

  return makeGifFrame(img, delay);
}

export async function renderHorizontalScrollingTextGif(textItem, {
  delay = 100,
  pixelsPerFrame = 1,
  backgroundColor = DEFAULT_BG
} = {}) {
  const font = fontCache[textItem.fontName] || await loadFont(textItem.fontName);
  fontCache[textItem.fontName] = font;
  const textColor = textItem.color || DEFAULT_FG; // Still using global default if no color

  let textWidth = 0;
  for (const ch of textItem.content) textWidth += font[ch] ? font[ch].width + 1 : 4;
  const totalPixels = textWidth + 64;
  const totalFrames = Math.ceil(totalPixels / pixelsPerFrame);
  const frames = [];

  for (let i = 0; i < totalFrames; i++) {
    const offset = i * pixelsPerFrame;
    const img = pureimage.make(64, 32);
    const ctx = img.getContext('2d');
    clearCanvas(ctx, backgroundColor);

    const scrollItem = new TextContent({ ...textItem, x: 64 - offset });
    await drawText(ctx, scrollItem);

    frames.push(makeGifFrame(img, delay));
  }

  return frames;
}

export async function renderVerticalScrollingTextGif(textItem, {
  delay = 100,
  pixelsPerFrame = 1,
  backgroundColor = DEFAULT_BG
} = {}) {
  const font = fontCache[textItem.fontName] || await loadFont(textItem.fontName);
  fontCache[textItem.fontName] = font;
  const textColor = textItem.color || DEFAULT_FG; // Using global color if not specified

  const glyphHeight = Math.max(...Object.values(font).map(g => g.height));
  const maxWidth = 64;

  const lines = [];
  let currentLine = '', currentWidth = 0;
  const words = textItem.content.split(/(\s+)/);

  for (const word of words) {
    let wordWidth = 0;
    for (const ch of word) wordWidth += font[ch] ? font[ch].width + 1 : 4;

    if (wordWidth <= maxWidth) {
      if (currentWidth + wordWidth > maxWidth && currentLine) {
        lines.push(currentLine.trim());
        currentLine = word.trimStart();
        currentWidth = [...currentLine].reduce((w, ch) => w + (font[ch] ? font[ch].width + 1 : 4), 0);
      } else {
        currentLine += word;
        currentWidth += wordWidth;
      }
    } else {
      for (let i = 0; i < word.length;) {
        let part = '', partWidth = 0;
        while (i < word.length) {
          const ch = word[i];
          const chWidth = font[ch] ? font[ch].width + 1 : 4;
          if (partWidth + chWidth > maxWidth - 5) break;
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

  const totalHeight = lines.length * (glyphHeight + textItem.lineSpacing);
  const totalFrames = Math.ceil((totalHeight + 32) / pixelsPerFrame);
  const frames = [];

  for (let i = 0; i < totalFrames; i++) {
    const offset = i * pixelsPerFrame;
    const img = pureimage.make(64, 32);
    const ctx = img.getContext('2d');
    clearCanvas(ctx, backgroundColor);

    lines.forEach((line, idx) => {
      const yPos = 32 - offset + idx * (glyphHeight + textItem.lineSpacing);
      const lineItem = new TextContent({
        content: line,
        fontName: textItem.fontName,
        x: 0,
        y: yPos,
        color: textColor
      });
      drawText(ctx, lineItem);
    });

    frames.push(makeGifFrame(img, delay));
  }

  return frames;
}

export async function renderMultilineHorizontalScrollGif({
  textItems,
  delay = 100,
  pixelsPerFrame = 1,
  backgroundColor = DEFAULT_BG
}) {
  for (const item of textItems) {
    if (!fontCache[item.fontName]) fontCache[item.fontName] = await loadFont(item.fontName);
  }

  const totalFrames = Math.max(...textItems.map(item => {
    const font = fontCache[item.fontName];
    let textWidth = 0;
    for (const ch of item.content) textWidth += font[ch] ? font[ch].width + 1 : 4;
    return Math.ceil((textWidth + 64) / pixelsPerFrame);
  }));

  const frames = [];

  for (let i = 0; i < totalFrames; i++) {
    const img = pureimage.make(64, 32);
    const ctx = img.getContext('2d');
    clearCanvas(ctx, backgroundColor);

    for (const item of textItems) {
      const scrollItem = new TextContent({ ...item, x: 64 - i * pixelsPerFrame });
      drawText(ctx, scrollItem);
    }

    frames.push(makeGifFrame(img, delay));
  }

  return frames;
}

export { TextContent };


