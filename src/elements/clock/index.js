import getCanvas from "../../lib/getCanvas.js";
import getFont from "../../lib/getFont.js";

export default function clock() {
  const canvas = getCanvas();
  const ctx = canvas.getContext(`2d`);
  const font = getFont(`7x14`);

  const time = new Date().toLocaleTimeString(`en-us`, {
    hour12: false,
  });

  font.drawText(ctx, time, 2, 14);
  const buffer = canvas.toBuffer(`image/png`);

  return buffer;
}
