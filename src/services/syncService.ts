import { client } from "../index.js"
import { TaskList } from "../models/types.js"
import { getTaskLists, getTasksFromList } from "./taskService.js"
import { postListToNotion, getNotionListPageById, postTaskToNotion, getListPages, archiveProjectPage, getTaskPages, archiveTaskPage } from "./notionService.js"
import { shouldDeleteListPage, taskPageFilter, shouldDeleteTaskPage } from "../helpers/taskHelpers.js"


//Main operation logic
export const runCycle = async () => {

    console.log('Fetching task lists...')
    const myTaskLists = await getTaskLists(client)

    if (myTaskLists) {
        await postAllTasksToNotion(myTaskLists)
        await runArchive(myTaskLists)
    } else {
        console.log('Error while fetching task lists')
    }
  }

export const postAllTasksToNotion = async (myTaskLists : TaskList[]) => {

    try {
        await Promise.all(
            myTaskLists.map(
                async (taskList) => {

                    await postListToNotion(taskList)
                    const myTasks = await getTasksFromList(client, taskList)
                    const listPageResponse = await getNotionListPageById(taskList.id)
            
                    if (myTasks && listPageResponse && listPageResponse.length>0) {
                        const myListPage = listPageResponse[0]

                        await Promise.all(
                            myTasks.map(
                                async (task) => await postTaskToNotion(task, myListPage)
                            )
                        ) 
                    } else {
                        console.log('Couldnt fetch tasks or error while posting list page')
                    }
                }
              )
        )
        console.log('All tasks and lists have been posted to Notion.')

    } catch (error) {
        console.error('Error while posting tasks and lists to Notion:', error)
    }
}

export const runArchive = async (myTaskLists: TaskList[]) => {

    const myProjectsPages = await getListPages()
    const myTaskPages = await getTaskPages()
    
    //Archiving Project Pages that are no longer in the google db
    if (myTaskLists && myProjectsPages) {
        const projectPagesToDelete = myProjectsPages.filter((projectPage) => shouldDeleteListPage(projectPage, myTaskLists))
        
        const listIDsToDelete : ( string | undefined) [] = projectPagesToDelete.map( (projectPage) => {
            return projectPage.id ?? undefined
        })

        await Promise.all(
            listIDsToDelete.map( async (listId) => {
                if (listId) {
                    await archiveProjectPage(listId)
                }
            })
        )
        console.log('Project pages have been archived')
    } else {
        console.log('Couldnt retrieve tasklists or project pages')
    }

    //Archiving task pages
    if (myTaskPages) {
        const taskPagesToDelete = await taskPageFilter(myTaskPages, shouldDeleteTaskPage)

        const taskIDsToDelete : (string | undefined)[] = taskPagesToDelete.map( (taskPage) => taskPage.id ?? undefined)

        await Promise.all(
            taskIDsToDelete.map( async (taskId) => {
                if (taskId) {
                    await archiveTaskPage(taskId)
                }
            })
        )
        console.log('Task pages have been archived')
    } else {
        console.log('Couldnt retrieve task pages')
    }
}