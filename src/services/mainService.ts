import { client } from "../index.js"
import { IPageObject, RelationProperty, TextProperty, TitleProperty } from "../models/notionTypes.js"
import { TaskList } from "../models/types.js"
import { getTaskListById, getTaskLists, getTasksFromList } from "./googleTasksService.js"
import { postListToNotion, getNotionListPageById, postTaskToNotion, getListPages, archiveProjectPage, getTaskPages, archiveTaskPage, getNotionPage } from "./notionService.js"


//Main operation logic

export const runCycle = async () => {

    console.log('Fetching task lists...')
    getTaskLists(client)

    .then((myTaskLists) => {
        if (myTaskLists) {
            myTaskLists.forEach(
              async (taskList) => {
                await postListToNotion(taskList)
                const myTasks = await getTasksFromList(client, taskList)
                const listPageResponse = await getNotionListPageById(taskList.id)
        
                if (myTasks && listPageResponse && listPageResponse.length>0) {
                  const myListPage = listPageResponse[0]
                  myTasks.forEach(
                    async (task) => await postTaskToNotion(task, myListPage)
                  )
                } else {
                  console.log('Couldnt fetch tasks or error while posting list page')
                }
              }
            )
          }
          return myTaskLists
    })
    .then( async (myTaskLists) => {

        const myProjectsPages = await getListPages()
        const myTaskPages = await getTaskPages()
        
        //Archiving Project Pages that are no longer in the google db
        if (myTaskLists && myProjectsPages) {
            const projectPagesToDelete = myProjectsPages.filter( async (projectPage) => await filterTaskListToDelete(projectPage, myTaskLists))
            
            const listIDsToDelete : string[] = []
            projectPagesToDelete.forEach ( (projectPage) => {
                const listID = projectPage.id
                if (listID) {
                    listIDsToDelete.push(listID)
                }
            })
            listIDsToDelete.forEach( async (listId) => await archiveProjectPage(listId))
            console.log('Project pages have been archived')
        } else {
            console.log('Couldnt retrieve tasklists or project pages')
        }

        //Archiving task pages
        if (myTaskPages) {
            const taskPagesToDelete = myTaskPages.filter( async (taskPage) => await filterTaskPageToDelete(taskPage))

            const taskIDsToDelete : string[] = []
            taskPagesToDelete.forEach ( (taskPage) => {
                const taskID = taskPage.id
                if (taskID) {
                    taskIDsToDelete.push(taskID)
                }
            })
            taskIDsToDelete.forEach( async (taskId) => await archiveTaskPage(taskId))
            console.log('Task pages have been archived')
        } else {
            console.log('Couldnt retrieve task pages')
        }
    })
  }

export const filterTaskPageToDelete = async (taskPage: IPageObject) : Promise<boolean> => {
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
        console.log('Related Notion project page for task page', name, 'wasnt found')
        return true
    }
}

export const filterTaskListToDelete = async (taskList: IPageObject, taskListArray: TaskList[]) : Promise<boolean> => {
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