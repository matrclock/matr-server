import path from 'path';
import fs from 'fs';

export async function loadConfig() {
    const CONFIG_FILE = path.join(process.env.PWD, 'config.json');

    if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error('config.json file not found.');
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));

    return config;
    
}