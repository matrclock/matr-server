import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';
import { renderTextGif } from '../renderGifText.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const tz = "America/Denver";

export function daysUntil({ date, text, icon }) {
  return async () => {

      function days(isoDate, tz = dayjs.tz.guess()) {
        const now = dayjs().tz(tz).startOf('day');
        const target = dayjs(isoDate).tz(tz).startOf('day');
        return target.diff(now, 'day');
      }
      
      const countdown = days(date, tz);

      const yOffset = 1;
      return await renderTextGif([
          {
              content: icon,
              fontName: 'streamline_all',
              x: 1,
              y: 5,
              color: '#9C5A5A'
          },
          {
              content: text,
              fontName: 'Tiny5-Regular',
              x: 25,
              y: yOffset
          },
          {
              content: String(countdown),
              fontName: 'profont22',
              x: 25,
              y: yOffset + 5,
              color: '#5A799C'
          },
      ], 1000);
  }
  
}
