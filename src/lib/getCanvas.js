import { createCanvas } from "canvas";

export default function getCanvas() {
  /*
    Intentionally not customizable. 
    Matr is intended to be represented by large pixels in a 2:1 format
*/
  const width = 64;
  const height = 32;

  return createCanvas(width, height);
}
