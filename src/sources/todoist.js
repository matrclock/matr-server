import fetch from 'node-fetch';
import dayjs from 'dayjs';
import { renderMultilineHorizontalScrollGif, TextContent } from '../renderGifText.js';
import { loadConfig } from "../loadConfig.js";

const config = await loadConfig();
const TODOIST_API_TOKEN = config.sources.todoist.key;
const TODOIST_API_URL = 'https://api.todoist.com/rest/v2';

// Categorize task by due date
function categorizeTask(task) {
  const dateStr = task.due?.date;
  if (!dateStr) return 'tasks';

  const now = dayjs();
  const due = dayjs(dateStr);

  if (due.isBefore(now.startOf('day'))) return 'overdue';
  if (due.isSame(now, 'day')) return 'today';
  if (due.isSame(now.add(1, 'day'), 'day')) return 'tomorrow';
  return 'tasks';
}

// Render full string per category
const CATEGORY_RENDERERS = {
  overdue: task => {
    const due = dayjs(task.due?.date);
    const daysLate = dayjs().startOf('day').diff(due, 'day');
    return `\x038C3F3FLate\x0F ${task.content}`;
  },
  today: task => {
    const time = task.due?.datetime
      ? dayjs(task.due.datetime).format('h:mm A')
      : '';
    return `\x034a5b44Today${time ? ' @ ' + time + ' ' : ' '}\x0F${task.content}`;
  },
  tomorrow: task => {
    return `\x039C5A2DTomorrow\x0F ${task.content}`;
  },
  tasks: task => task.content
};

export function todoist(start = 0, stop = 4) {
  return async () => {
    try {
      const tasksRes = await fetch(`${TODOIST_API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${TODOIST_API_TOKEN}`
        }
      });

      const allTasks = await tasksRes.json();

      // Group tasks
      const groups = {
        overdue: [],
        today: [],
        tomorrow: [],
        tasks: []
      };

      for (const task of allTasks) {
        const category = categorizeTask(task);
        groups[category].push(task);
      }

      // Flatten and render
      const combined = [
        ...groups.overdue.map(t => ({
          rendered: CATEGORY_RENDERERS.overdue(t)
        })),
        ...groups.today.map(t => ({
          rendered: CATEGORY_RENDERERS.today(t)
        })),
        ...groups.tomorrow.map(t => ({
          rendered: CATEGORY_RENDERERS.tomorrow(t)
        })),
        ...groups.tasks.map(t => ({
          rendered: CATEGORY_RENDERERS.tasks(t)
        })),
      ];

      // Slice selected range
      const taskSlice = combined.slice(start, stop);

      const speeds = [1, Math.sqrt(2), Math.E - 1, Math.PI / 2].sort(() => Math.random() - 0.5);
      const colors = ['#ccc', '#999', '#666', '#333'];

      const textItems = taskSlice.map((task, idx) => {
        return new TextContent({
          content: `${task.rendered}`,
          fontName: "Tiny5-Regular",
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