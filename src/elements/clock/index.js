import getCanvas from "../../lib/getCanvas.js";
import getGifEncoder from "../../lib/getGifEncoder.js";
import getFont from "../../lib/getFont.js";

export default function clock() {
  const canvas = getCanvas();
  const ctx = canvas.getContext(`2d`);

  const encoder = getGifEncoder();
  const font = getFont(`7x14`);

  const time = new Date().toLocaleTimeString(`en-us`, {
    hour12: false,
  });

  encoder.start();
  font.drawText(ctx, time, 2, 14);
  encoder.addFrame(ctx);
  encoder.finish();

  const buffer = encoder.out.getData();

  return buffer;
}
