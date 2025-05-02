export const timeUntil = (isoString, timeZone) => {
    const now = new Date();
  
    // Parse the naive ISO string (assumed local time, but we'll correct that)
    const targetLocal = new Date(isoString);
  
    // Use `Intl.DateTimeFormat` to get UTC offset for the target zone/time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    });
  
    const offsetMinutes = (() => {
      const parts = formatter.formatToParts(targetLocal);
      const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+00:00';
      const match = tzPart.match(/GMT([+-]\d+):?(\d+)?/);
      const hours = parseInt(match?.[1] || '0', 10);
      const minutes = parseInt(match?.[2] || '0', 10);
      return hours * 60 + minutes;
    })();
  
    // Convert local target time + offset to UTC
    const targetUTC = new Date(targetLocal.getTime() + offsetMinutes * 60 * 1000);
    const diffMs = targetUTC - now;
  
    if (diffMs <= 0) return null;
  
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    return { hours, minutes, seconds };
  }