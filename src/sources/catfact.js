import fetch from 'node-fetch';  // If using Node.js v16.x or below, install "node-fetch" package.

// catfact.mjs
export const catfact = async () => {
    console.log('Fetching cat fact...');
    try {
      const response = await fetch('https://catfact.ninja/fact');
      const data = await response.json();
      return data.fact;
    } catch (error) {
      console.error('Error fetching cat fact:', error);
      return null;
    }
  };