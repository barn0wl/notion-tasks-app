import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { authorize } from './googleAuth.js';
import { getTaskLists, getTasksFromList } from './services/googleTasksService.js';
import { postTaskToNotion } from './services/notionService.js';

dotenv.config();
const app = express();

//middleware

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Initialize Notion client with your API key
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})
export const databaseId : string = process.env.DATABASE_ID || ""

//start the server

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export const client = await authorize()

const myTaskList = await getTaskLists(client)

if (myTaskList) {
  myTaskList.forEach(
    async (taskList) => {
      const myTasks = await getTasksFromList(taskList.id, client)

      if (myTasks) {
        myTasks.forEach(
          (task) => postTaskToNotion(task)
        )
      }
    }
  )
}