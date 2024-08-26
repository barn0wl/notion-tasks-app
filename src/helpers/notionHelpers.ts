import { IPageObject } from "../models/notionTypes.js"
import { TaskList, Task } from "../models/types.js"

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