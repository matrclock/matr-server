export const time = () => {
    const now = new Date();
    now.setHours(now.getHours() - 6); // Adjust for UTC-6
  
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
  
    return `${hours}:${minutes}`;
  }
  