import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import dayjs from 'dayjs';
import { renderTextGif } from '../renderGifText.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

const tz = "America/Denver";

export function time(delay) {
  return async () => {
    const now = dayjs.utc().tz(tz);

    const dayOfWeekname = now.format('dddd');
    const monthShortName = now.format('MMMM');
    const dayOfMonth = now.format('Do');

    const theTime = now.format('HH:mm');
    return await renderTextGif([
      {
        content: `\x039C5A2D${dayOfWeekname}\x0F`,
        fontName: 'Tiny5-Regular',
        x: 2,
        y: 0
      },
      {
        content: `${monthShortName} ${dayOfMonth}`,
        fontName: 'Tiny5-Regular',
        x: 2,
        y: 7
      },
      {
        content: theTime,
        fontName: 'profont22',
        x: 2,
        y: 12,
        color: '#4a5b44'
      }
    ], delay * 1000)
  }
}

  