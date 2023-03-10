import { createCanvas } from "canvas";

export default function getCanvas() {
  /*
    Intentionally not customizable. 
    Matr is intended to be represented by large pixels in a 2:1 format
*/
  const width = 64;
  const height = 32;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext(`2d`);

  ctx.fillStyle = `#000`;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = `#fff`;

  return canvas;
}
