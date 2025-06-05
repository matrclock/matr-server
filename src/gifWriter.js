import fs from 'fs';
import path from 'path';
import { GifCodec, GifFrame, BitmapImage, GifUtil } from 'gifwrap';

export async function calculateDwell(frames) {
    if (!frames || frames.length === 0) return 100;
    return frames.reduce((sum, frame) => sum + frame.delayCentisecs / 100, 0);
}

export async function getGifData(frames) {
    const codec = new GifCodec();
    const frameArray = Array.isArray(frames) ? frames : [frames];
    const gif = await codec.encodeGif(frameArray, { loops: 0 });
    return gif.buffer
}

export async function getBinData(frames) {
    const frameArray = Array.isArray(frames) ? frames : [frames];
    return await gifFramesToBin(frameArray);
}

export async function gifFileToFrames(filename) {
    const gif = await GifUtil.read(filename);
    return gif.frames;
}

export async function gifFramesToBin(frames) {
    const width = frames[0].bitmap.width;
    const height = frames[0].bitmap.height;
    const frameCount = frames.length;

    const palette = [];
    const colorMap = new Map();
    const frameBuffers = [];

    for (const frame of frames) {
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
    return output
}

export async function binToGif(inputFilename, outputFilename) {
    const inputBuffer = await fs.promises.readFile(inputFilename);

    const width = inputBuffer.readUInt8(0);
    const height = inputBuffer.readUInt8(1);
    const frameCount = inputBuffer.readUInt16LE(2);

    const palette = [];
    let offset = 4;
    for (let i = 0; i < 256; i++) {
        const r = inputBuffer.readUInt8(offset + i * 3 + 0);
        const g = inputBuffer.readUInt8(offset + i * 3 + 1);
        const b = inputBuffer.readUInt8(offset + i * 3 + 2);
        palette.push([r, g, b]);
    }
    offset += 256 * 3;

    const frames = [];

    for (let i = 0; i < frameCount; i++) {
        const duration = inputBuffer.readUInt16LE(offset);
        offset += 2;

        const indices = [];
        for (let j = 0; j < width * height; j++) {
            indices.push(inputBuffer.readUInt8(offset + j));
        }
        offset += width * height;

        const pixels = new Uint8Array(width * height * 4);
        for (let j = 0; j < width * height; j++) {
            const index = indices[j];
            const [r, g, b] = palette[index];
            pixels[j * 4 + 0] = r;
            pixels[j * 4 + 1] = g;
            pixels[j * 4 + 2] = b;
            pixels[j * 4 + 3] = 255;
        }

        const bmp = new BitmapImage({ width, height, data: Buffer.from(pixels) });
        const frame = new GifFrame(bmp, {
            delayCentisecs: Math.round(duration / 10),
        });

        frames.push(frame);
    }

    const codec = new GifCodec();
    const { buffer: gifBuffer } = await codec.encodeGif(frames, { loops: 0 });

    await fs.promises.mkdir(path.dirname(outputFilename), { recursive: true });
    await fs.promises.writeFile(outputFilename, gifBuffer);

}

export async function writeGifToFile(frames, filename) {
    const {buffer} = await getGifData(frames);
    await fs.promises.writeFile(filename, buffer);
}

export async function writeBinToFile(frames, filename) {
    const output = await gifFramesToBin(frames);
    await fs.promises.writeFile(filename, output);
}