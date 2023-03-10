import pkg from "bdf-canvas";
import { readFileSync } from "fs";
import { resolve } from "path";

const { BDFFont } = pkg;

export default function getFont(name) {
  const bdfbody = readFileSync(
    resolve(process.cwd(), `src`, `fonts`, `${name}.bdf`),
    `utf8`
  );

  return new BDFFont(bdfbody);
}
