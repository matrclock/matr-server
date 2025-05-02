import fetch from 'node-fetch';  // If using Node.js v16.x or below, install "node-fetch" package.

export const dadJoke = async () => {
  try {
    const response = await fetch('https://icanhazdadjoke.com/', {
      headers: { 'Accept': 'application/json' }
    });
    const data = await response.json();  // Parse JSON response
    return data.joke;  // Return the joke
  } catch (error) {
    console.error('Error fetching joke:', error);
    return null;  // Return null in case of an error
  }
};
