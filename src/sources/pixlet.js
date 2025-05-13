import fs from 'fs';
import { gifFileToFrames } from '../gifWriter.js';
import { loadConfig } from "../loadConfig.js";
import path from "path";

const srcDir = path.join(process.cwd(), 'src');
const distDir = path.join(process.cwd(), 'dist');


export const pixlet = async () => {
    // Get pixlet path using loadConfig
    const config = await loadConfig();
    const pixletPath = config.sources.pixlet.path;


    const starfile = path.join(srcDir, 'sources', 'pixlet', 'apps', 'sunrise_sunset', 'sunrise_sunset.star');

    // Run pixlet command, output to /tmp/pixlet.gif
    const { exec } = await import('child_process');
    const foo = await exec(`${pixletPath} render --gif -o ${distDir}/pixlet.gif ${starfile}`);

    // Read the file and return the buffer
    return gifFileToFrames(`${distDir}/pixlet.gif`);
  }
