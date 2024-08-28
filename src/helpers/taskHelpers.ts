import { client } from "../index.js"
import { IPageObject, TitleProperty, TextProperty, RelationProperty } from "../models/notionTypes.js"
import { TaskList } from "../models/types.js"
import { getNotionPage } from "../services/notionService.js"
import { getTaskListById, getTasksFromList } from "../services/taskService.js"


export const shouldDeleteTaskPage = async (taskPage: IPageObject) : Promise<boolean> => {
    // this function filters Notions task pages and returns a boolean that determines if
    // the task page should be deleted or not

    const nameProp = taskPage.properties.Name as TitleProperty
    const name = nameProp.title[0].text.content

    const taskIDProp = taskPage.properties.GTaskID as TextProperty
    const taskID = taskIDProp.rich_text[0].text.content

    const projectProp = taskPage.properties.Project as RelationProperty
    const projectPageID = projectProp.relation[0].id

    const projectPage = await getNotionPage(projectPageID)

    if ( projectPage ) {

        const listIDProp = projectPage.properties.GTaskID as TextProperty
        const listID = listIDProp.rich_text[0].text.content
        const list = await getTaskListById(client, listID)

        if (list) {
            const tasks = await getTasksFromList(client, list)
            if (tasks) {
                const foundTask = tasks.filter( (task) => taskID === task.id)
                if (foundTask.length>0) {
                    console.log('Task', name, 'exists in the google db still')
                    return false
                } else {
                    console.log('Task', name, 'isnt in the google db anymore')
                    return true
                }
            } else {
                console.log('The related list for task', name, 'is empty')
                return true
            }
        } else {
            console.log('The list for task', name, 'isnt in the Google db anymore')
            return true
        }
    } else {
        console.log('Related Notion project page for task page', name, 'wasnt found')
        return true
    }
}

export const shouldDeleteListPage = (taskList: IPageObject, taskListArray: TaskList[]) : boolean => {
    const nameProp = taskList.properties.Name as TitleProperty
    const name = nameProp.title[0].text.content

    const listIDProp = taskList.properties.GTaskID as TextProperty
    const listID = listIDProp.rich_text[0].text.content

    const foundList = taskListArray.filter(
        (list) => list.id === listID
    )
    if (foundList.length>0) {
        console.log('List', name, 'exists in the google db still')
        return false
    } else {
        console.log('List', name, 'isnt in the google db anymore')
        return true
    }
}

export const taskPageFilter = async (array : IPageObject[], predicate : (taskPage: IPageObject) => Promise<boolean> ) : Promise<IPageObject[]> => {
    const results = await Promise.all(array.map(predicate))
    return array.filter((_value, index) => results[index])
}