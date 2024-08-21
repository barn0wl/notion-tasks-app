import { IPageObject } from "../models/notionTypes.js";
import { Task, TaskList } from "../models/types.js";
import { notion, projectsDatabaseId, tasksDatabaseId } from "../index.js";

export function parseListToNotionPage(list: TaskList) : IPageObject {
    return {
        properties: {
            Name: {
                type: "title",
                title: [
                    {
                        type: "text",
                        text: {
                            content: list.title
                        }
                    }
                ]
            },
            "List URL": {
                type: "url",
                url: list.selfLink?? ""
            },
            GTaskID : {
                "rich_text" : [{
                    type: "text",
                    text: {
                        content: list.id
                    }
                }]

            }
        }
    }
}

export function parseTaskToNotionPage(task: Task, notionListPageId: string) : IPageObject {
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
            Project : {
                type: "relation",
                relation: [{
                    id: notionListPageId
                }]
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
export const postListToNotion = async (list: TaskList) => {

    let page: IPageObject

    const pageResponse = await getNotionListPageById(list.id)

    if (pageResponse && pageResponse.length > 0) {
        console.log('List is already in db')
        page = pageResponse[0]

        if (page.id) updateNotionListPage(page.id, list)
            .then(() => console.log('list has been updated in db'))
            .catch((error) => console.log('Error updating list:', error))
    } else {
        console.log('List isnt already in db')
        page = parseListToNotionPage(list)

        try {
            const response = await notion.pages.create({
                parent: {
                    type: 'database_id',
                    database_id: projectsDatabaseId,
                },
                properties: page.properties
            })
            console.log("List added to Notion:", response)
        } catch(error) {
            console.log("Error adding list to Notion:", error)
        }
    }
}

export const postTaskToNotion = async (task: Task, listPage: IPageObject) => {

    let page: IPageObject
    const listPageId = listPage.id

    const pageResponse = await getNotionTaskPageById(task.id)

    if (pageResponse && pageResponse.length > 0) {
        console.log('Task is already in db')
        page = pageResponse[0]

        if (page.id && listPageId) updateNotionTaskPage(page.id, task, listPageId)
            .then(() => console.log('task has been updated in db'))
            .catch((error) => console.log('Error updating task:', error))

    } else {
        console.log('Task isnt already in db')

        if (listPageId) {
                page = parseTaskToNotionPage(task, listPageId)

            try {
                const response = await notion.pages.create({
                    parent: {
                        type: 'database_id',
                        database_id: tasksDatabaseId,
                    },
                    properties: page.properties
                })
                console.log("Task added to Notion:", response)
            } catch(error) {
                console.log("Error adding task to Notion:", error)
            }
        }
    }
}

export const updateNotionListPage = async (listId: string, list: TaskList) => {
    try {
        const response = await notion.pages.update({
            page_id: listId,
            properties: {
                Name: {
                    title: [{
                        text: { content: list.title}
                    }]
              }
            },
          })
          console.log(response)
    } catch (error) {
        console.log("Error updating Notion project:", error)
    }
}

export const updateNotionTaskPage = async (pageId: string, task: Task, notionListPageId: string) => {
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
                },
                Project: {
                    relation: [{
                        id: notionListPageId
                    }]
                }
            },
          })
          console.log(response)
    } catch (error) {
        console.log("Error updating Notion task:", error)
    }
}

export const getNotionListPageById = async (listId: string) => {
    try {
        const response = await notion.databases.query({
            database_id: projectsDatabaseId,
            filter: {
                  property: 'GTaskID',
                  rich_text: {
                    equals: listId,
                  },
                }
          })
        return response.results as IPageObject[]
    } catch (error) {
        console.log("Error querying projects database:", error)
    }
}

export const getNotionTaskPageById = async (taskId : string) => {
    try {
        const response = await notion.databases.query({
            database_id: tasksDatabaseId,
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

export const postTaskListToNotion = async (taskList: Task[], listPage: IPageObject) => {
    taskList.forEach(
        (task) => {
            try {
                postTaskToNotion(task, listPage)
            } catch {
                console.error()
            }
        }
    )
}