import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import { loadImage } from "canvas";

export default async function peaberry() {
  
  return [
    await loadImage(resolve(__dirname, `0.png`)),
    await loadImage(resolve(__dirname, `1.png`)),
    await loadImage(resolve(__dirname, `2.png`)),
    await loadImage(resolve(__dirname, `3.png`)),
    await loadImage(resolve(__dirname, `4.png`)),
    await loadImage(resolve(__dirname, `5.png`)),
    await loadImage(resolve(__dirname, `6.png`)),
    await loadImage(resolve(__dirname, `7.png`)),
    await loadImage(resolve(__dirname, `8.png`)),
    await loadImage(resolve(__dirname, `9.png`)),
    await loadImage(resolve(__dirname, `_.png`))
  ]
    
}
