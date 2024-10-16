//Model imports
import { SyncState, SyncStateChanges, Task} from "../models/types.js"
import { NotionData } from "../models/notionTypes.js";

//Services
import { authorize } from '../services/authService.js';
import { addListPageToNotion, addTaskPageToNotion, archivePage,
    getListPages, getTaskPages, updateNotionListPage, updateNotionTaskPage } from "../services/notionService.js";
import { deleteTask, deleteTaskList, getTaskLists, getTasksFromList, insertTask, insertTaskList, patchTask, patchTaskList } from "../services/taskService.js";

//Helpers
import { parseListToNotionPage, parseNotionData, parseNotionState, parseTaskToNotionPage } from "../helpers/notionHelpers.js";
import { applyChangesToState, compareStates, reconcileChanges } from "../helpers/stateHelpers.js";


const googleTasksClient = await authorize()

let syncState: SyncState = {
    tasklists: [],
    tasks: []
}

async function getNotionState(): Promise<{notionData: NotionData;notionState: SyncState;} | undefined> {
    try {
        const myProjectsPages = await getListPages()
        const myTaskPages = await getTaskPages()
        if (myProjectsPages && myTaskPages) {
            const notionData = parseNotionData(myProjectsPages, myTaskPages)
            const notionState = parseNotionState(notionData)
            return { notionData, notionState }
        }
    } catch (error) {
        console.log("Error fetching Notion state", error)
    }
}

async function getGoogleTasksState(): Promise<SyncState | undefined> {
    try {
        const myTaskLists = await getTaskLists(googleTasksClient)
        const myTasks : Task[] = []
        if (myTaskLists) {
            await Promise.all( myTaskLists.map( async taskList => {
                const listId = taskList.id
                const tasks = await getTasksFromList(googleTasksClient, listId)
                if (tasks) tasks.forEach( task => myTasks.push(task))
            }))
            return {
                tasklists: myTaskLists,
                tasks: myTasks
            }
        }
    } catch (error) {
        console.log("Error fetching Google Tasks state", error)
    } 
}

async function pushChangesToNotion (data: NotionData, changes: SyncStateChanges) {
    //taskLists
    await Promise.all(
        changes.taskLists.added.map( async addedList => {
            //first, we push the change to Notion
            const pageId = await addListPageToNotion(parseListToNotionPage(addedList))
            //then, we update the Notion data to reflect the new changes
            if (pageId) data.projects.push({
                pageId: pageId,
                list: addedList
            })
            else console.log("Error while adding list page")
        })
    )

    await Promise.all(
        changes.taskLists.updated.map( async updatedList => {
            let projectData = data.projects.find(project => updatedList.id === project.list.id)
            if (projectData) {
                try {
                    await updateNotionListPage(projectData.pageId, updatedList.title)
                    projectData.list.title = updatedList.title
                } catch (error) {
                    console.log("Error updating list page", error)
                }
            } else console.log("Project page for this list wasnt found in database")
        })
    )

    await Promise.all(
        changes.taskLists.deleted.map( async deletedId => {
            const projectData = data.projects.find(project => deletedId === project.list.id)
            if (projectData) {
                try {
                    await archivePage(projectData.pageId)
                    data.projects = data.projects.filter( pData => pData.pageId !== projectData.pageId)
                } catch (error) {
                    console.log("Error deleting list page", error)
                }
            }
            else console.log("Project page for this list wasnt found in database")
        })
    )


    //tasks
    await Promise.all(
        changes.tasks.added.map( async addedTask => {
            const projectData = data.projects.find(project => addedTask.taskListId === project.list.id)
            if (projectData) {
                const pageId = await addTaskPageToNotion(parseTaskToNotionPage(addedTask, projectData.pageId))
                if (pageId) data.tasks.push({
                    pageId: pageId,
                    task: addedTask,
                    projectPageId: projectData.pageId
                })
                else console.log("Error while adding task page")
            }
            else console.log("Project page for this task wasnt found in database")
        })
    )

    await Promise.all(
        changes.tasks.updated.map( async update => {
            let taskData = data.tasks.find( tData => tData.task.id === update.id)
            const projectData = data.projects.find(project => update.taskListId === project.list.id)
            if (taskData && projectData) {
                try {
                    await updateNotionTaskPage(taskData.pageId, update, projectData.pageId)
                    taskData.task = update
                    taskData.projectPageId = projectData.pageId
                } catch (error) {
                    console.log("Error updating task page", error)
                }
            }
            else console.log("Task page or project page for this task wasnt found in database")
        })
    )
    
    await Promise.all(
        changes.tasks.deleted.map( async deletedId => {
            const taskData = data.tasks.find( tData => tData.task.id === deletedId)
            if (taskData) {
                try {
                    await archivePage(taskData.pageId)
                    data.tasks = data.tasks.filter( tData => tData.pageId !== taskData.pageId)
                } catch (error) {
                    console.log("Error deleting task page", error)
                }
            }
            else console.log("Project page for this task wasnt found in database")
        })
    )
}

async function pushChangesToGoogleTasks (state: SyncState, changes: SyncStateChanges) {

    //tasklists
    await Promise.all(
        changes.taskLists.added.map( async addedList => {
            try {
                await insertTaskList(googleTasksClient, addedList)
                state.tasklists.push(addedList)
            } catch (error) {
                console.log("Error adding tasklist", error)
            }
        })
    )

    await Promise.all(
        changes.taskLists.updated.map( async update => {
            try {
                await patchTaskList(googleTasksClient, update)
                let list = state.tasklists.find( list => list.id === update.id)
                if (list) list = update
            } catch (error) {
                console.log("Error updating tasklist", error)
            } 
        })
    )

    await Promise.all(
        changes.taskLists.deleted.map( async deletedId => {
            try {
                await deleteTaskList(googleTasksClient, deletedId)
                state.tasklists = state.tasklists.filter( list => list.id !== deletedId)
            } catch (error) {
                console.log("Error deleting tasklist", error)
            }
        })
    )

    //tasks
    await Promise.all(
        changes.tasks.added.map( async addedTask => {
            try {
                await insertTask(googleTasksClient, addedTask)
                state.tasks.push(addedTask)
            } catch (error) {
                console.log("Error adding task", error)
            }
        })
    )

    await Promise.all(
        changes.tasks.updated.map( async update => {
            try {
                await patchTask(googleTasksClient, update)
                let task = state.tasks.find( task => task.id === update.id)
                if (task) task = update
            } catch (error) {
                console.log("Error updating task", error)
            }
        })
    )

    await Promise.all(
        changes.tasks.deleted.map( async deletedId => {
            try {
                const task = state.tasks.find(task => task.id === deletedId)
                if (task) await deleteTask(googleTasksClient, task)
                state.tasks = state.tasks.filter( task => task.id !== deletedId)
            } catch (error) {
                console.log("Error deleting task", error)
            }
        })
    )
}

//Main operation logic
export async function runCycle() {
    try {
        console.log("Fetching Notion and GoogleTasks states...")
        const notionStateResponse = await getNotionState()
        const googleTaskState = await getGoogleTasksState()

        if (notionStateResponse && googleTaskState) {
            const {notionData, notionState} = notionStateResponse
            console.log("Notion state:", notionState)
            console.log("Google task state:", googleTaskState)

            const notionChanges = compareStates(syncState, notionState)
            const googleTaskChanges = compareStates(syncState, googleTaskState)

            console.log("Notion changes:", notionChanges)
            console.log("Google task changes:", googleTaskChanges)

            const finalChanges = reconcileChanges(notionChanges, googleTaskChanges)
            console.log("Final changes:", finalChanges)

            applyChangesToState(syncState, finalChanges)

            //updating googleTasks and notion states based on new synced state
            const changesToNotionState = compareStates(notionState, syncState)
            const changesToGoogleTaskState = compareStates(googleTaskState, syncState)
            console.log("New changes to notion:", changesToNotionState)
            console.log("New changes to googleTasks:", changesToGoogleTaskState)

            //push changes to each API
            console.log("Pushing changes to Notion...")
            await pushChangesToNotion(notionData, changesToNotionState)
            console.log("Pushing changes to Google Tasks...")
            await pushChangesToGoogleTasks(googleTaskState, changesToGoogleTaskState)
            console.log("All operations have been completed. End of cycle.")
            console.log("Current syncstate:", syncState)
        }
    } catch (error) {
        console.log("Error while syncing tasks!", error)
    }  
}