import fetch from 'node-fetch';

const url = 'https://www.eco-visio.net/api/aladdin/1.0.0/pbl/publicwebpage/data/102035172?begin=20250101&end=20250502&step=6&domain=4825&t=02acb73fa4f78f1baa968ee3532bb625c24abf364601a807b53d95196a60f247&withNull=true';

export const fococount = async () => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const data = await response.json();

  const sum = data.reduce((acc, entry) => acc + (entry.comptage || 0), 0);
  return sum;
}