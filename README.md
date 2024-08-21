# Notion Tasks App

This is a simple back-end project written by me using Node and Typescript.

The app makes use of the [Google Tasks API](https://github.com/googleapis) and the [Notion API](https://developers.notion.com).
It operates automatically on the server side every 14 minutes to fetch tasks from my Google Tasks account and add them to my Notion
databases.

Google Tasks are added to my Tasks database, while Lists are added to my Projects database.

Properties exported from Tasks are:
- **id** (assigned to a Notion text property called "GTaskID")
- **title** (assigned to the Notion title property called "Name")
- **url** (assigned to "Task URL", type url)
- **status** (assigned to "Done", type checkbox)
- **due date** (assigned to "Due", type Date)
- **date of completion** (assigned to "Completed", type Date)

Properties exported from Lists are:
- **id** (assigned to "GTaskID", type text)
- **title** (assigned to "Name", type title)
- **url** (assigned to "List URL", type url)

Only changes made in Google Tasks are reflected in Notion. Checking out or creating a new task in the Notion database does
not have any effect on the Google Tasks database.

You can reuse this code and test it for yourself but make sure to define the environment variables in a .env file:
- **NOTION_API_KEY:** your Notion API key
- **TASKS_DATABASE_ID:** the ID of the database to use for the task imports (must have properties specified above)
- **PROJECTS_DATABASE_ID:** the ID of the database to use for the projects imports (must have properties specified above)

Project also needs a credentials.json file to work. You can get one by heading to the [Google Cloud Console](https://console.cloud.google.com/),
activating the Google Tasks API for your project, and then follow the instructions for Oauth 2.0 Client IDs.
