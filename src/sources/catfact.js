import fetch from 'node-fetch';  // If using Node.js v16.x or below, install "node-fetch" package.
import { renderVerticalScrollingTextGif, TextContent } from '../renderGifText.js';

// catfact.mjs
export const catfact = async () => {
    console.log('Fetching cat fact!!!...');
    try {
      const response = await fetch('https://catfact.ninja/fact');
      const data = await response.json();

      const textItem = new TextContent({
        content: data.fact,
        fontName: "Tiny5-Regular", // Replace with your actual font JSON name (without .json)
        x: 0,
        y: 0,
        color: "#333",
        lineSpacing: -7
      });
    
      return await renderVerticalScrollingTextGif(textItem, {
        delay: 100,
        pixelsPerFrame: 1,
      });

    } catch (error) {
      console.error('Error fetching cat fact:', error);
      return null;
    }
  };