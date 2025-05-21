import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';
import { renderTextGif } from '../renderGifText.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const tz = "America/Denver";

export function time(delay) {
  return async () => {
    const now = dayjs.utc().tz(tz);
    const theTime = now.format('HH:mm');
    return await renderTextGif([
      {
        content: 'The \x039C5A2Dtime\x0F is',
        fontName: 'Tiny5-Regular',
        x: 2,
        y: 1
      },
      {
        content: theTime,
        fontName: 'profont22',
        x: 2,
        y: 7,
        color: '#4a5b44'
      }], delay * 1000)
  }
}

  