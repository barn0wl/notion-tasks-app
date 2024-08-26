//Imports
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { authorize } from './services/authService.js';
import { runCycle } from './services/syncService.js';

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

//Run cycle on GET requests at origin route
app.get('/', (_req, res) => {
  runCycle()
  .then( () => res.send('Done syncing tasks!').status(200))
  .catch( (error) => res.send(`Error while syncing tasks: ${error}`).status(400))
})