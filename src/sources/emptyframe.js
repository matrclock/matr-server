import { renderTextGif } from '../renderGifText.js';

export const emptyframe = async () => {
    return await renderTextGif([
      {
        content: '',
        fontName: 'Tiny5-Regular',
        x: 0,
        y: 0
      }], 100)
  }
  