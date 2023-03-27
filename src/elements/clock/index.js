import getCanvas from "../../lib/getCanvas.js";
import getGifEncoder from "../../lib/getGifEncoder.js";
import getFont from "../../lib/getFont.js";

export default function clock() {
  const seconds = 30;
  const canvas = getCanvas();
  const ctx = canvas.getContext(`2d`);

  const encoder = getGifEncoder();
  encoder.setDelay(1000);
  const font = getFont(`7x14`);

  const time = new Date();

  /*
    We *could* allow for just outputting an array of frames,
    but this would require a structure to define delays.
    While directly exposing the encoder seems hacky, it makes
    explicit that the responsibily for generating a gif is up 
    to the developer. Do it however you'd like, this is just
    one way.
  */
  encoder.start();
  for (let i = 0; i < seconds; i += 1) {
    ctx.fillStyle = `#000000`;
    ctx.fillRect(0, 0, 64, 32);

    ctx.fillStyle = `#fff`;
    const timeStr = time.toLocaleTimeString(`en-us`, {
      hour12: false,
    });
    font.drawText(ctx, timeStr, 4, 18);
    time.setSeconds(time.getSeconds() + 1);
    encoder.addFrame(ctx);
  }

  encoder.finish();

  const buffer = encoder.out.getData();

  return buffer;
}
