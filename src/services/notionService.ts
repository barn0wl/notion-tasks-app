import { IPageObject} from "../models/notionTypes.js";
import { Task, TaskList } from "../models/types.js";
import { notion, projectsDatabaseId, tasksDatabaseId } from "../index.js";
import { parseListToNotionPage, parseTaskToNotionPage } from "../helpers/notionHelpers.js";

export const postListToNotion = async (list: TaskList) => {

    let page: IPageObject

    const pageResponse = await getNotionListPageById(list.id)

    if (pageResponse && pageResponse.length > 0) {
        console.log('List', list.title ,'is already in db')
        page = pageResponse[0]

        if (page.id) updateNotionListPage(page.id, list)
            .then(() => console.log('list', list.title ,'has been updated in db'))
            .catch((error) => console.log('Error updating list:', list.title, error))
    } else {
        console.log('List', list.title ,'isnt already in db')
        page = parseListToNotionPage(list)

        try {
            await notion.pages.create({
                parent: {
                    type: 'database_id',
                    database_id: projectsDatabaseId,
                },
                properties: page.properties
            })
            console.log("List", list.title , "added to Notion")
        } catch(error) {
            console.log("Error adding list", list.title, "to Notion:", error)
        }
    }
}

export const postTaskToNotion = async (task: Task, listPage: IPageObject) => {

    let page: IPageObject
    const listPageId = listPage.id

    const pageResponse = await getNotionTaskPageById(task.id)

    if (pageResponse && pageResponse.length > 0) {
        console.log('Task', task.title, 'is already in db')
        page = pageResponse[0]

        if (page.id && listPageId) updateNotionTaskPage(page.id, task, listPageId)
            .then(() => console.log('Task', task.title, 'has been updated in db'))
            .catch((error) => console.log('Error updating task:', task.title, error))

    } else {
        console.log('Task', task.title, 'isnt already in db')

        if (listPageId) {
                page = parseTaskToNotionPage(task, listPageId)

            try {
                await notion.pages.create({
                    parent: {
                        type: 'database_id',
                        database_id: tasksDatabaseId,
                    },
                    properties: page.properties
                })
                console.log("Task", task.title, "added to Notion")
            } catch(error) {
                console.log('Error adding task to Notion:', error)
            }
        }
    }
}

export const updateNotionListPage = async (listId: string, list: TaskList) => {
    try {
        await notion.pages.update({
            page_id: listId,
            properties: {
                Name: {
                    title: [{
                        text: { content: list.title}
                    }]
              }
            },
          })
    } catch (error) {
        console.log("Error updating Notion project:", error)
    }
}

export const updateNotionTaskPage = async (pageId: string, task: Task, notionListPageId: string) => {
    try {
        await notion.pages.update({
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
    } catch (error) {
        console.log("Error updating Notion task:", error)
    }
}

export const getNotionListPageById = async (listId: string) => {
    try {
        const response = await notion.databases.query({
            database_id: projectsDatabaseId,
            filter: {
                and: [
                        {
                            property: 'GTaskID',
                            rich_text: {
                                equals: listId,
                            },
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

export const getNotionTaskPageById = async (taskId : string) => {
    try {
        const response = await notion.databases.query({
            database_id: tasksDatabaseId,
            filter: {
                and: [
                        {
                            property: 'GTaskID',
                            rich_text: {
                                equals: taskId,
                            },
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

export const postTaskListToNotion = async (taskList: Task[], listPage: IPageObject) => {
    try {
        await Promise.all(
            taskList.map(
                async (task) => {
                    try {
                        await postTaskToNotion(task, listPage)
                    } catch {
                        console.error()
                    }
                }
            )
        )
    } catch (error) {
        console.error('Error occured while posting tasks to Notion:', error)
    }
}

export const archiveTaskPage = async (pageId: string) => {
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

export const archiveProjectPage = async (pageId: string) => {
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
        console.log('Error while archiving project:', err)
    }
}

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

export const getNotionPage = async (pageId: string) => {
    try {
        const response = await notion.pages.retrieve({
            page_id: pageId
        })
        return response as IPageObject
    } catch(err) {
        console.log("Error querying page:", err)
    }
}