import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Task, TaskList } from '../models/types.js';

// Lists the user's task lists

export async function getTaskLists(auth: OAuth2Client): Promise<TaskList[]|undefined> {
    const service = google.tasks({ version: 'v1', auth });
    const res = await service.tasklists.list();
    const taskLists = res.data.items;
    if (taskLists && taskLists.length) {
      return taskLists as TaskList[]
    } else {
      console.log('No task lists found.');
    }
  }

export async function getTasksFromList(auth: OAuth2Client, listId: string): Promise<Task[]|undefined> {
    const service = google.tasks({ version: 'v1', auth });
    const res = await service.tasks.list(
        {
            tasklist : listId,
            showHidden : true
        }
    )
    const taskList = res.data.items
    if (taskList && taskList.length) {
        return taskList as Task[]
      } else {
        console.log('No task lists found.');
      }
  }