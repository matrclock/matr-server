import fs from 'fs';
import path from 'path';
import { GifFrame, BitmapImage } from 'gifwrap';
import pureimage from 'pureimage';

const srcDir = path.join(process.cwd(), 'src');

const DEFAULT_BG = '#000';
const DEFAULT_FG = '#333';

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

  let cursorX = x;
  let currentColor = color || DEFAULT_FG; // Default color if none is specified

  // Function to parse and set the color (format \x03RRGGBB)
  const setColor = (colorCode) => {
    if (colorCode && colorCode.length === 7 && colorCode[0] === '\x03') {
      const hexColor = colorCode.slice(1); // Get the RRGGBB part
      if (hexColor.length === 6) {
        ctx.fillStyle = `#${hexColor}`;  // Set the color correctly
      } else {
        console.error('Invalid color code length');
      }
    }
  };

  // Initially set the color (if not provided by control codes)
  ctx.fillStyle = currentColor;

  let index = 0;
  while (index < content.length) {
    let ch = content[index];

    // Check for color control code (\x03) - color change
    if (ch === '\x03') {
      // Get the next 7 characters (color code in MIRC format "\x03RRGGBB")
      if (index + 7 <= content.length) {
        const colorCode = content.slice(index, index + 7);
        setColor(colorCode);
        index += 7; // Skip the color code
      } else {
        index += 1; // In case the color code is malformed, just skip
      }
      continue;
    }

    // Check for reset control code (\x0F) - reset color
    if (ch === '\x0F') {
      ctx.fillStyle = color || DEFAULT_FG; // Reset to original color
      index += 1;
      continue;
    }

    // Otherwise, draw the character
    const glyph = font[ch];
    if (!glyph) {
      console.warn(`Missing glyph for character: ${ch}`);
      cursorX += 4;
      index += 1;
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
    index += 1;
  }
}


function clearCanvas(ctx, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 64, 32);
}

function stripMircCodes(text) {
  return text
    .replace(/\x03[0-9A-Fa-f]{6}/g, '')  // Remove \x03 + 6 hex digits
    .replace(/\x0F/g, '');              // Remove reset code
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

  return [makeGifFrame(img, delay)];
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
  const textColor = textItem.color || DEFAULT_FG;

  const glyphHeight = Math.max(...Object.values(font).map(g => g.height));
  const maxWidth = 64;

  const lines = [];
  const paragraphs = textItem.content.split('\n');

  for (const paragraph of paragraphs) {
    let currentLine = '', currentWidth = 0, activeCodes = '';
    const words = paragraph.split(/(\s+)/); // Keep spaces for wrapping

    for (const word of words) {
      const plainWord = stripMircCodes(word);
      let wordWidth = 0;
      for (const ch of plainWord) wordWidth += font[ch] ? font[ch].width + 1 : 4;

      if (wordWidth <= maxWidth) {
        if (currentWidth + wordWidth > maxWidth && currentLine) {
          lines.push(currentLine.trimEnd());
          currentLine = activeCodes + word.trimStart();
          currentWidth = [...stripMircCodes(currentLine)].reduce((w, ch) => w + (font[ch] ? font[ch].width + 1 : 4), 0);
        } else {
          currentLine += word;
          currentWidth += wordWidth;
        }
        // Update active color code
        const match = word.match(/\x03[0-9A-Fa-f]{6}/g);
        if (match) activeCodes = match[match.length - 1];
        if (word.includes('\x0F')) activeCodes = '';
      } else {
        // Split long word with color codes preserved
        let i = 0, part = '', partPlain = '', partWidth = 0;
        let localCodes = activeCodes;

        while (i < word.length) {
          const ch = word[i];
          if (ch === '\x03') {
            const colorCode = word.slice(i, i + 7).match(/\x03[0-9A-Fa-f]{6}/);
            if (colorCode) {
              localCodes = colorCode[0];
              part += localCodes;
              i += 7;
              continue;
            }
          } else if (ch === '\x0F') {
            localCodes = '';
            part += '\x0F';
            i++;
            continue;
          }

          const plainCh = stripMircCodes(ch);
          const chWidth = font[plainCh] ? font[plainCh].width + 1 : 4;
          if (partWidth + chWidth > maxWidth - 5) break;

          part += ch;
          partPlain += plainCh;
          partWidth += chWidth;
          i++;
        }

        const needsHyphen = i < word.length;
        if (needsHyphen) {
          part += '-';
          partWidth += font['-'] ? font['-'].width + 1 : 4;
        }

        if (currentWidth + partWidth > maxWidth && currentLine) {
          lines.push(currentLine.trimEnd());
          currentLine = activeCodes + part;
          currentWidth = partWidth;
        } else {
          currentLine += part;
          currentWidth += partWidth;
        }

        if (currentWidth >= maxWidth || needsHyphen) {
          lines.push(currentLine.trimEnd());
          currentLine = activeCodes;
          currentWidth = 0;
        }

        // Update activeCodes for next part
        if (word.includes('\x0F')) activeCodes = '';
        else {
          const match = word.match(/\x03[0-9A-Fa-f]{6}/g);
          if (match) activeCodes = match[match.length - 1];
        }
      }
    }

    if (currentLine.trim()) lines.push(currentLine.trimEnd());
  }

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


