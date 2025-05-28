import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';
import { renderTextGif } from '../renderGifText.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const tz = "America/Denver";

export const trashday = async () => {
  const isTodayFriday = dayjs.utc().tz(tz).day() === 5;
  if (isTodayFriday) {
    const yOffset = 1;
    return await renderTextGif([
        {
            content: 'ŏ',
            fontName: 'streamline_all',
            x: -1,
            y: 5,
            color: '#4A6D9C'
        },
        {
            content: 'Put the',
            fontName: 'Tiny5-Regular',
            x: 21,
            y: yOffset
        },
        {
            content: 'trash',
            fontName: 'profont17',
            x: 18,
            y: yOffset + 5,
            color: '#4a5b44'
        },
        {
            content: 'bins out',
            fontName: 'Tiny5-Regular',
            x: 21,
            y: yOffset + 19
        }
    ], 1000);
  } else {
    return [];
  }
}
  