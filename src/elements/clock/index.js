import { loadImage } from "canvas";

import getCanvas from "../../lib/getCanvas.js";
import getGifEncoder from "../../lib/getGifEncoder.js";
import getFont from "../../lib/getFont.js";
import peaberry from './image_fonts/peaberry/index.js'
import peaberryLoader from "./image_fonts/peaberry/index.js";
import dayjs from "dayjs";

export default async function clock() {
  const canvas = getCanvas();
  const ctx = canvas.getContext(`2d`);

  const encoder = getGifEncoder();
  const font = getFont(`5x7`);

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

  const peaberry = await peaberryLoader()

  encoder.setDelay(60000);
  const minutes = 10;

  for (let i = 0; i < minutes; i += 1) {
    ctx.fillStyle = `#000`;
    ctx.fillRect(0, 0, 64, 32);

    ctx.fillStyle = `#FFF`;
    const timeStr = dayjs(time).add(i, 'minute').format('HH:mm')
    
    function cText() {
      font.drawText(ctx, timeStr, 4, 18);
    }
    
    
    function cImg() {
      const pos = [3,0]
      timeStr.split('').forEach(c => {
        let glyph = peaberry[10]
        if (c !== ':') glyph = peaberry[c]
        ctx.drawImage(glyph, pos[0], 5, glyph.width, glyph.height);
        pos[0] += glyph.width - 10;
  
      })
    }
    
    cText()
    

    encoder.addFrame(ctx);
  }

  encoder.finish();

  const buffer = encoder.out.getData();

  return buffer;
}
