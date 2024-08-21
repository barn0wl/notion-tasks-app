import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { authorize } from './googleAuth.js';
import { getTaskLists, getTasksFromList } from './services/googleTasksService.js';
import { getNotionListPageById, postListToNotion, postTaskToNotion } from './services/notionService.js';

dotenv.config();
const app = express();

//middleware

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Initialize Notion client with your API key
export const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})
export const tasksDatabaseId : string = process.env.TASKS_DATABASE_ID || ""
export const projectsDatabaseId : string = process.env.PROJECTS_DATABASE_ID || ""

//start the server

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export const client = await authorize()

//main operation logic

const runCycle = async () => {
  const myTaskLists = await getTaskLists(client)

  if (myTaskLists) {
    myTaskLists.forEach(
      async (taskList) => {
        await postListToNotion(taskList)
        const myTasks = await getTasksFromList(client, taskList.id)
        const listPageResponse = await getNotionListPageById(taskList.id)

        if (myTasks && listPageResponse && listPageResponse.length>0) {
          const myListPage = listPageResponse[0]
          myTasks.forEach(
            (task) => postTaskToNotion(task, myListPage)
          )
        } else {
          console.log('Couldnt fetch tasks or list page doesnt exist')
        }
      }
    )
  }
}

//Run cycle on GET requests at origin route
app.get('/', (req, res) => {
  runCycle()
  .then( () => res.send('Done syncing tasks!').status(200))
  .catch( (error) => res.send(`Error while syncing tasks: ${error}`).status(400))
})