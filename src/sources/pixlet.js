import fs from 'fs';
import { gifFileToFrames } from '../gifWriter.js';
import { loadConfig } from "../loadConfig.js";
import path from "path";

const srcDir = path.join(process.cwd(), 'src');


export const pixlet = async () => {
    // Get pixlet path using loadConfig
    const config = await loadConfig();
    const pixletPath = config.sources.pixlet.path;

    const starfile = path.join(srcDir, 'sources', 'pixlet', 'sunrise_sunset.star');

    // Run pixlet command, output to /tmp/pixlet.gif
    const { exec } = await import('child_process');
    await exec(`${pixletPath} render -gif -o /tmp/pixlet.gif ${starfile}`);

    // Read the file and return the buffer
    return gifFileToFrames('/tmp/pixlet.gif');
  }