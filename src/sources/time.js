import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import dayjs from 'dayjs';

dayjs.extend(utc);
dayjs.extend(timezone);

export const time = () => {
    const now = dayjs.utc().tz("America/Denver");
    return now.format('HH:mm');
  }
  