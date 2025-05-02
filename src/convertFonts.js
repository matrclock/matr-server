import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { mkdir, readdir, writeFile, access } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function parseBdf(filePath) {
    const glyphs = {};
    let glyph = null;
    let inBitmap = false;

    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const parts = line.trim().split(/\s+/);

        if (line.startsWith('STARTCHAR')) {
            glyph = {};
            inBitmap = false;
        } else if (line.startsWith('ENCODING')) {
            glyph.encoding = parseInt(parts[1]);
        } else if (line.startsWith('BBX')) {
            glyph.width = parseInt(parts[1]);
            glyph.height = parseInt(parts[2]);
            glyph.xOffset = parseInt(parts[3]);
            glyph.yOffset = parseInt(parts[4]);
        } else if (line.startsWith('BITMAP')) {
            inBitmap = true;
            glyph.bitmap = [];
        } else if (line.startsWith('ENDCHAR')) {
            if (glyph && glyph.encoding >= 0) {
                glyph.char = String.fromCharCode(glyph.encoding);
                glyphs[glyph.char] = glyph;
            }
            glyph = null;
            inBitmap = false;
        } else if (inBitmap && glyph) {
            const byteWidth = Math.ceil(glyph.width / 8);
            const bin = parseInt(line.trim(), 16)
                .toString(2)
                .padStart(byteWidth * 8, '0');
            const row = bin
                .slice(0, glyph.width)
                .split('')
                .map(Number);
            glyph.bitmap.push(row);
        }
    }

    return glyphs;
}


export async function convertAllBdfFonts() {
    const bdfDir = path.join(__dirname, 'bdf');
    const glyphDir = path.join(__dirname, 'glyphs');

    await mkdir(glyphDir, { recursive: true });

    const files = await readdir(bdfDir);
    const bdfFiles = files.filter(f => f.endsWith('.bdf'));

    for (const bdfFile of bdfFiles) {
        const fontName = path.basename(bdfFile, '.bdf');
        const outputPath = path.join(glyphDir, `${fontName}.json`);

        try {
            await access(outputPath);
            //console.log(`✅ Skipping ${fontName} (already exists)`);
            continue;
        } catch {
            // File doesn't exist — continue
        }

        const bdfPath = path.join(bdfDir, bdfFile);
        console.log(`⏳ Converting ${bdfFile}...`);

        try {
            const glyphs = await parseBdf(bdfPath);
            await writeFile(outputPath, JSON.stringify(glyphs, null, 2));
            console.log(`✅ Saved ${fontName}.json`);
        } catch (err) {
            console.error(`❌ Failed to convert ${bdfFile}: ${err.message}`);
        }
    }
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    convertAllBdfFonts();
}
