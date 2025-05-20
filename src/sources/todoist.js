import fetch from 'node-fetch';  // Required for Node.js v16 and below
import { renderVerticalScrollingTextGif, TextContent } from '../renderGifText.js';
import { loadConfig } from "../loadConfig.js";

const config = await loadConfig();
const TODOIST_API_TOKEN = config.sources.todoist.key;
const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

export const todoist = async () => {
  console.log('Fetching top 3 Todoist tasks from "Master"...');

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
    const colorizedTasks = tasks.slice(0, 3).map((task, i) => {
      const content = task.content;
      if (i === 0) return `\x039933331. ${content}`; // dull red
      if (i === 1) return `\x039999332. ${content}`; // dull yellow
      return `\x033399663. ${content}`;              // muted green
    });

    // Step 3: Render scrolling text
    const textItem = new TextContent({
      content: colorizedTasks.join('\n'),
      fontName: "Tiny5-Regular", // Adjust as needed
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
    return null;
  }
};