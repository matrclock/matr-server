import { renderTextGif } from '../renderGifText.js';

export const emptyframe = async () => {
    return await renderTextGif([
      {
        content: 'No Apps Available',
        fontName: 'Tiny5-Regular',
        x: 0,
        y: 0
      }], 100)
  }
  