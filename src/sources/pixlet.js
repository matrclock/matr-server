import fs from 'fs';
import { gifFileToFrames } from '../gifWriter.js';
import { loadConfig } from "../loadConfig.js";
import path from "path";
import { promisify } from 'util';
import { exec as _exec } from 'child_process';
import { renderTextGif, TextContent } from '../renderGifText.js';

const srcDir = path.join(process.cwd(), 'src');
const distDir = path.join(process.cwd(), 'dist');

const exec = promisify(_exec);

export const pixlet = (name = 'sunrise_sunset', pixletConfig = {}) => {
  return async function () {
    // Load config to get pixlet path
    const config = await loadConfig();
    const pixletPath = config.sources.pixlet.path;

    // Convert key-value object to CLI format
    const keyValues = Object.entries(pixletConfig)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');

    const starfile = path.join(srcDir, 'sources', 'pixlet', 'apps', name, `${name}.star`);
    const outputGif = path.join(distDir, 'pixlet.gif');

    // Run pixlet render command
    try {
      const { stdout, stderr } = await exec(
        `${pixletPath} render ${starfile} ${keyValues} --gif -o ${outputGif}`
      );

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      return gifFileToFrames(outputGif);
    } catch (error) {
      console.error("Pixlet render failed:", name, error.stderr || error.message);
      return await renderTextGif([
        {
            content: 'Pixlet',
            fontName: '6x13B',
            x: 1,
            y: 2,
            color: '#3A1A1A'
        },
        {
            content: 'render failed',
            fontName: 'Tiny5-Bold',
            x: 1,
            y: 13
            },
        {
            content: name,
            fontName: 'Tiny5-Regular',
            x: 1,
            y: 20,
            color: '#4a5b44'
        }], 5000)
    }

    // Read the rendered GIF and return its frames
    return gifFileToFrames(outputGif);
  };
};