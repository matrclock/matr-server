import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';
import { renderTextGif } from '../renderGifText.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const tz = "America/Denver";

export const coffeeOutside = async () => {
    const isTomorrowFriday = dayjs.utc().tz(tz).add(1, 'day').day() === 5;
  if (isTomorrowFriday) {
    const yOffset = 3;
    return await renderTextGif([
        {
            content: 'Ć',
            fontName: 'streamline_all',
            x: -1,
            y: 5,
            color: '#6F4E37'
        },
        {
            content: 'tomorrow is',
            fontName: 'Tiny5-Regular',
            x: 21,
            y: yOffset
        },
        {
            content: 'coffee',
            fontName: 'Tiny5-Regular',
            x: 21,
            y: yOffset + 8,
            color: '#4a5b44'
        },
        {
            content: 'outside',
            fontName: 'Tiny5-Regular',
            x: 21,
            y: yOffset + 16
        }
    ], 1000);
  } else {
    return [];
  }
}
  