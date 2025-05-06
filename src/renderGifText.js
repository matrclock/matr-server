import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GifCodec, GifFrame, BitmapImage, GifUtil } from 'gifwrap';
import pureimage from 'pureimage';

const srcDir = path.join(process.cwd(),'src');
const distDir = path.join(process.cwd(), 'dist');
const BACKGROUND_COLOR = 'black';
const FOREGROUND_COLOR = 'darkgrey';

async function loadFont(fontName) {
  const fontPath = path.join(srcDir, 'glyphs', `${fontName}.json`);
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

export async function renderTextGif(input, delay = 1000) {
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
  return new GifFrame(bmp, { delayCentisecs: delay / 10 });
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
  const outDir = distDir
  await fs.promises.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  await fs.promises.writeFile(outPath, buffer);
  console.log(`✅ Saved ${outPath}`);
}

export async function gifToBin(inputFilename, outputFilename) {
  const codec = new GifCodec();
  const inputPath = path.join(distDir, inputFilename);
  const gif = await GifUtil.read(inputPath);

  const width = gif.frames[0].bitmap.width;
  const height = gif.frames[0].bitmap.height;
  const frameCount = gif.frames.length;

  const palette = [];
  const colorMap = new Map();
  const frameBuffers = [];


  let j = 0
  for (const frame of gif.frames) {
    const bmp = frame.bitmap;
    const pixels = bmp.data;
    const indices = Buffer.alloc(width * height);

    for (let i = 0, j = 0; i < pixels.length; i += 4, j++) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const key = (r << 16) | (g << 8) | b;
      let index;
      if (colorMap.has(key)) {
        index = colorMap.get(key);
      } else {
        if (palette.length >= 256) {
          throw new Error('Too many colors (over 256) in GIF');
        }
        index = palette.length;
        palette.push([r, g, b]);
        colorMap.set(key, index);
      }
      indices[j] = index;
    }
    
    frameBuffers.push({
      duration: frame.delayCentisecs * 10, // to ms
      data: indices,
    });
  }

  const header = Buffer.alloc(4 + 256 * 3);
  header[0] = width;
  header[1] = height;
  header.writeUInt16LE(frameCount, 2);

  for (let i = 0; i < 256; i++) {
    const [r, g, b] = palette[i] || [0, 0, 0];
    header[4 + i * 3 + 0] = r;
    header[4 + i * 3 + 1] = g;
    header[4 + i * 3 + 2] = b;
  }

  const frameData = frameBuffers.map(({ duration, data }) => {
    const buf = Buffer.alloc(2 + data.length);
    buf.writeUInt16LE(duration, 0);
    data.copy(buf, 2);
    return buf;
  });

  const output = Buffer.concat([header, ...frameData]);
  const outPath = path.join(distDir, outputFilename);
  await fs.promises.writeFile(outPath, output);
  console.log(`✅ Saved ${outPath}`);
}

export async function binToGif(inputFilename, outputFilename) {
  const inputPath = path.join(distDir, inputFilename);
  const inputBuffer = await fs.promises.readFile(inputPath);  // Renaming the input file buffer

  const width = inputBuffer.readUInt8(0); // Read width from header
  const height = inputBuffer.readUInt8(1); // Read height from header
  const frameCount = inputBuffer.readUInt16LE(2); // Read frame count from header


  // Extract the color palette (256 colors max)
  const palette = [];
  let offset = 4;
  for (let i = 0; i < 256; i++) {
    const r = inputBuffer.readUInt8(offset + i * 3 + 0);
    const g = inputBuffer.readUInt8(offset + i * 3 + 1);
    const b = inputBuffer.readUInt8(offset + i * 3 + 2);
    palette.push([r, g, b]);
  }
  offset += 256 * 3; // Move past the palette

  // Read the frames and reconstruct the bitmap data
  const frames = [];

  for (let i = 0; i < frameCount; i++) {
    const duration = inputBuffer.readUInt16LE(offset); // Frame duration in ms
    offset += 2;

    const indices = [];
    for (let j = 0; j < width * height; j++) {
      indices.push(inputBuffer.readUInt8(offset + j));
    }
    offset += width * height;

    // Convert indices back to pixels using the palette
    const pixels = new Uint8Array(width * height * 4); // RGBA
    for (let j = 0; j < width * height; j++) {
      const index = indices[j];
      const [r, g, b] = palette[index];
      pixels[j * 4 + 0] = r;
      pixels[j * 4 + 1] = g;
      pixels[j * 4 + 2] = b;
      pixels[j * 4 + 3] = 255; // Full opacity (no transparency)
    }

    // Create a BitmapImage from the pixel data (as a Buffer)
    const bmp = new BitmapImage({ width: width, height: height, data: Buffer.from(pixels) });

    // Create a GifFrame for each frame using BitmapImage
    const frame = new GifFrame(bmp, {
      delayCentisecs: Math.round(duration / 10), // Convert ms to centiseconds
    });

    frames.push(frame);
  }

  // Ensure frames is an array
  if (!Array.isArray(frames)) {
    throw new Error('Frames data is not in the expected array format');
  }


  // Use GifCodec to encode the GIF and write it to a file
  const codec = new GifCodec();
  const frameArray = Array.isArray(frames) ? frames : [frames];
  const { buffer: gifBuffer } = await codec.encodeGif(frameArray, { loops: 0 });

  // Ensure the output directory exists
  const outDir = distDir
  await fs.promises.mkdir(outDir, { recursive: true });

  // Write the GIF buffer to the file
  const outPath = path.join(outDir, outputFilename);
  await fs.promises.writeFile(outPath, gifBuffer);

  console.log(`✅ Saved ${outPath}`);
}