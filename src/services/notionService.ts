import { IPageObject } from "../models/notionTypes.js";
import { Task } from "../models/types.js";
import { notion } from "../index.js";
import { databaseId } from "../index.js";

export function parseTaskToNotionPage(task: Task) : IPageObject {
    return {
        properties: {
            Name: {
                type: "title",
                title: [
                    {
                        type: "text",
                        text: {
                            content: task.title
                        }
                    }
                ]
            },
            Due: {
                type: "date",
                date: task.due? {
                    start: task.due,
                    } : null
            },
            Completed : {
                type: "date",
                date: task.completed? {
                    start: task.completed,
                    } : null
            },
            Done: {
                type: "checkbox",
                checkbox: task.status === 'completed'? true : false,
              },
            "Task URL": {
                type: "url",
                url: task.selfLink?? ""
            },
            GTaskID : {
                "rich_text" : [{
                    type: "text",
                    text: {
                        content: task.id
                    }
                }]

            }
        }
    }
}

export const postTaskToNotion = async (task: Task) => {

    let page: IPageObject

    const pageResponse = await getNotionTaskPageById(task.id)

    if (pageResponse) {
        page = pageResponse[0]
        await updateNotionTaskPage(page.id, task)
    }

    page = parseTaskToNotionPage(task)

    try {
        const response = await notion.pages.create({
            parent: {
                type: 'database_id',
                database_id: databaseId,
            },
            properties: page.properties
        })
        console.log(response)
    }catch(error) {
        console.log("Error adding task to Notion:", error)
    }
}

export const updateNotionTaskPage = async (pageId: string, task: Task) => {
    try {
        const response = await notion.pages.update({
            page_id: pageId,
            properties: {
                Name: {
                    title: [{
                        text: { content: task.title}
                    }]
              },
                Due: {
                    date: task.due? {
                        start: task.due,
                        } : null
                },
                Completed: {
                    date: task.completed? {
                        start: task.completed,
                        } : null
                },
                Done: {
                    checkbox: task.status === 'completed'? true : false
                }
            },
          })
          console.log(response)
    } catch (error) {
        console.log("Error updating Notion task:", error)
    }
}

export const getNotionTaskPageById = async (taskId : string) => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                  property: 'GTaskID',
                  rich_text: {
                    equals: taskId,
                  },
                }
          })
        return response.results as IPageObject[]
    } catch (error) {
        console.log("Error querying tasks database:", error)
    }
}