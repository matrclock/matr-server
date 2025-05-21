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
  
      // Step 3: Render scrolling text
      const textItems = [
        new TextContent({
          content: '1.' + taskSlice[0],
          fontName: "Tiny5-Regular", // Adjust as needed
          x: 0,
          y: 0,
          pixelsPerFrame: 1/2,
          color: "#ccc",
          lineSpacing: -7
        }),
        new TextContent({
          content: '2.' + taskSlice[1],
          fontName: "Tiny5-Regular", // Adjust as needed
          x: 0,
          y: 8,
          pixelsPerFrame: 4/5,
          color: "#666",
          lineSpacing: -7
        }),
        new TextContent({
          content: '3.' + taskSlice[2],
          fontName: "Tiny5-Regular", // Adjust as needed
          x: 0,
          pixelsPerFrame: 3/4,
          y: 16,
          color: "#333",
          lineSpacing: -7
        }),
        new TextContent({
          content: '4.' + taskSlice[3],
          fontName: "Tiny5-Regular", // Adjust as needed
          pixelsPerFrame: 2/3,
          x: 0,
          y: 24,
          color: "#999",
          lineSpacing: -7
        }),
      ];
  
      return await renderMultilineHorizontalScrollGif({
        textItems,
        delay: 50,
        pixelsPerFrame: 1,
      });
  
    } catch (error) {
      return null;
    }
  };
}

