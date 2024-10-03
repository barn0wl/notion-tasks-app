import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import { IPageObject} from "../models/notionTypes.js";
import { Task } from "../models/types.js";

dotenv.config();

// Initialize Notion client with your API key
export const notion = new Client({
    auth: process.env.NOTION_API_KEY,
  })

const tasksDatabaseId : string = process.env.TASKS_DATABASE_ID || ""
const projectsDatabaseId : string = process.env.PROJECTS_DATABASE_ID || ""

// POST methods
export const addListPageToNotion = async (listPage: IPageObject) => {
    try {
        const response = await notion.pages.create({
            parent: {
                type: 'database_id',
                database_id: projectsDatabaseId,
            },
            properties: listPage.properties
        })
        console.log("List added to Notion")
        return response.id
    } catch(error) {
        console.log("Error adding list to Notion:", error)
    }
}

export const addTaskPageToNotion = async (taskPage: IPageObject) => {
    try {
        const response = await notion.pages.create({
            parent: {
                type: 'database_id',
                database_id: tasksDatabaseId,
            },
            properties: taskPage.properties
        })
        console.log("Task added to Notion")
        return response.id
    } catch(error) {
        console.log('Error adding task to Notion:', error)
    }
}

// UPDATE methods
export const updateNotionListPage = async (listPageId: string, newTitle: string) => {
    try {
        await notion.pages.update({
            page_id: listPageId,
            properties: {
                Name: {
                    title: [{
                        text: { content: newTitle}
                    }]
                }
            },
            })
    } catch (error) {
        console.log("Error updating Notion project:", error)
    }  
}

export const updateNotionTaskPage = async (taskPageId: string, updatedTask: Task, notionListPageId: string) => {
    try {
        await notion.pages.update({
            page_id: taskPageId,
            properties: {
                Name: {
                    title: [{
                        text: { content: updatedTask.title}
                    }]
                },
                Due: {
                    date: updatedTask.due? {
                        start: updatedTask.due,
                        } : null
                },
                Completed: {
                    date: updatedTask.completed? {
                        start: updatedTask.completed,
                        } : null
                },
                Done: {
                    checkbox: updatedTask.status === 'completed'? true : false
                },
                Project: {
                    relation: [{
                        id: notionListPageId
                    }]
                }
            },
            })
    } catch (error) {
        console.log("Error updating Notion task:", error)
    }
}

export const archivePage = async (pageId: string) => {
    try {
        await notion.pages.update({
            page_id: pageId,
            properties: {
                Archive: {
                    checkbox: true 
                }
            }
        })
    } catch(err) {
        console.log('Error while archiving task:', err)
    }
}

// GET methods: these are useful to first determine the state of the data on the end of Notion
export const getListPages = async () => {
    try {
        const response = await notion.databases.query({
            database_id: projectsDatabaseId,
            filter: {
                and: [
                        {
                        property: 'GTaskID',
                        rich_text: {
                            is_not_empty: true,
                            }
                        },
                        {
                            property: 'Archive',
                            checkbox: {
                                equals: false
                            }
                        } 
                    ]
                }
        })
        return response.results as IPageObject[]
    } catch (error) {
        console.log("Error querying projects database:", error)
    }
}

export const getTaskPages = async () => {
    try {
        const response = await notion.databases.query({
            database_id: tasksDatabaseId,
            filter: {
                and: [
                        {
                        property: 'GTaskID',
                        rich_text: {
                            is_not_empty: true,
                            }
                        },
                        {
                            property: 'Archive',
                            checkbox: {
                                equals: false
                            }
                        } 
                    ]
                }
        })
        return response.results as IPageObject[]
    } catch (error) {
        console.log("Error querying tasks database:", error)
    }
}