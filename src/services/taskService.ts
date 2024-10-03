import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Task, TaskList } from '../models/types.js';

export async function getTaskLists(auth: OAuth2Client): Promise<TaskList[]|undefined> {
  try {
    const service = google.tasks({ version: 'v1', auth });
    const res = await service.tasklists.list();
    const taskLists = res.data.items;

    if (taskLists && taskLists.length) {
      
      console.log('Task lists found')
      return taskLists as TaskList[]

    } else {
      console.log('No task lists found.');
    }
  } catch (error) {
    console.log('Error fetching task lists');
  }
}

export async function getTasksFromList(auth: OAuth2Client, listId: string): Promise<Task[]|undefined> {
  try {
    const service = google.tasks({ version: 'v1', auth });
    const res = await service.tasks.list(
        {
            tasklist : listId,
            showHidden : true
        }
    )
    const taskList = res.data.items
    if (taskList && taskList.length) {
        const formattedTaskList = taskList as Task[]
        formattedTaskList.forEach( task => task.taskListId = listId)
        console.log('List of tasks found. List ID:', listId)
        return formattedTaskList
    } else {
      console.log('No tasks found inside list. ID:', listId)
    }
  } catch (error) {
    console.log("Error fetching tasks from list. ID:", listId, error)
  }
}

export async function insertTaskList(auth: OAuth2Client, list: TaskList) {
  
  const service = google.tasks({ version: 'v1', auth });
  try {
    await service.tasklists.insert( {
      requestBody: list
    })
    console.log("New tasklist created. ID:", list.id)
  } catch (error) {
    console.log("Error creating task list. ID:", list.id, error)
  }
}

export async function insertTask(auth: OAuth2Client, task: Task) {
  
  const service = google.tasks({ version: 'v1', auth });
  try {
    await service.tasks.insert( {
      tasklist: task.taskListId,
      requestBody: task,
    })
    console.log("New task created. ID:", task.id)
  } catch (error) {
    console.log("Error creating task. ID:", task.id, error)
  }
}

export async function patchTaskList(auth: OAuth2Client, list: TaskList) {

  const service = google.tasks({ version: 'v1', auth });
  try {
    await service.tasklists.patch( {
      tasklist: list.id,
      requestBody: list
    })
    console.log("Tasklist updated. ID:", list.id)
  } catch (error) {
    console.log("Error updating task list. ID:", list.id, error)
  }
}

export async function patchTask(auth: OAuth2Client, task: Task) {

  const service = google.tasks({ version: 'v1', auth });
  try {
    await service.tasks.patch( {
      task: task.id,
      tasklist: task.taskListId,
      requestBody: task
    })
    console.log("Task updated. ID:", task.id)
  } catch (error) {
    console.log("Error updating task. ID:", task.id, error)
  }
}

export async function deleteTaskList(auth: OAuth2Client, listId: string) {

  const service = google.tasks({ version: 'v1', auth });
  try {
    await service.tasklists.delete( {
      tasklist: listId
    })
    console.log("Tasklist deleted. ID:", listId)
  } catch (error) {
    console.log("Error deleting tasklist. ID:", listId, error)
  }
}

export async function deleteTask(auth: OAuth2Client, task: Task) {

  const service = google.tasks({ version: 'v1', auth });
  try {
    await service.tasks.delete( {
      tasklist: task.taskListId,
      task: task.id
    })
    console.log("Task deleted. ID:", task.id)
  } catch (error) {
    console.log("Error deleting task. ID:", task.id, error)
  }
}