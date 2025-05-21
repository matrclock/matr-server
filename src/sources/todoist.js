import fetch from 'node-fetch';  // Required for Node.js v16 and below
import { renderMultilineHorizontalScrollGif, TextContent } from '../renderGifText.js';
import { loadConfig } from "../loadConfig.js";

const config = await loadConfig();
const TODOIST_API_TOKEN = config.sources.todoist.key;
const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

export function todoist(start = 0, stop = 4) {
  return async () => {  
    try {
      // Step 1: Fetch all projects
      const projectsRes = await fetch(`${TODOIST_API_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${TODOIST_API_TOKEN}`
        }
      });
  
      const projects = await projectsRes.json();
      const masterProject = projects.find(p => p.name === 'Master');
  
      if (!masterProject) {
        throw new Error('Project "Master" not found.');
      }
  
      // Step 2: Fetch tasks in the "Master" project
      const tasksRes = await fetch(`${TODOIST_API_URL}/tasks?project_id=${masterProject.id}`, {
        headers: {
          Authorization: `Bearer ${TODOIST_API_TOKEN}`
        }
      });
  
      const tasks = await tasksRes.json();
      const taskSlice = tasks.slice(start, stop).map(task => task.content);
  
      const speeds = [1, Math.sqrt(2), Math.E-1, Math.PI/2].sort(() => Math.random() - 0.5);
      const colors = ['#ccc', '#666', '#333', '#999'].sort(() => Math.random() - 0.5);

      const textItems = taskSlice.map((task, idx) => {
        return new TextContent({
          content: idx + 1 + '.' + task,
          fontName: "Tiny5-Regular", // Adjust as needed
          x: 0,
          y: idx * 8,
          pixelsPerFrame: speeds[idx],
          color: colors[idx],
          lineSpacing: -7
        });
      });
  
      return await renderMultilineHorizontalScrollGif({
        textItems,
        delay: 100,
        pixelsPerFrame: 1,
      });
  
    } catch (error) {
      return null;
    }
  };
}

