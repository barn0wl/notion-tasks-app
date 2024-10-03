import {SyncState, SyncStateChanges, Task, TaskList } from "../models/types.js"

export function compareStates (oldState: SyncState, newState: SyncState): SyncStateChanges {
    const changes: SyncStateChanges = {
          tasks: {
            added: [],
            deleted: [],
            updated: [],
          },
          taskLists: {
            added: [],
            deleted: [],
            updated: [],
          },
    }

    // tasklists
    const oldTaskListsMap = createTaskListMap(oldState.tasklists)
    const newTaskListsMap = createTaskListMap(newState.tasklists)

    //detecting added or updated task lists
    for (const newTaskList of newState.tasklists) {
        const oldTaskList = oldTaskListsMap.get(newTaskList.id)
        if (!oldTaskList) {
            changes.taskLists.added.push(newTaskList)
        } else {
            if (oldTaskList !== newTaskList) {
                changes.taskLists.updated.push({
                  id: newTaskList.id,
                  newValue: newTaskList,
                })
            }
        }
    }

    // detecting deleted task lists
    for (const oldTaskList of oldState.tasklists) {
        if (!newTaskListsMap.has(oldTaskList.id)) {
          changes.taskLists.deleted.push(oldTaskList.id);
        }
    }

    // tasks
    const oldTasksMap = createTaskMap(oldState.tasks)
    const newTasksMap = createTaskMap(newState.tasks)

    // detecting added or updated tasks
    for (const newTask of newState.tasks) {
        const oldTask = oldTasksMap.get(newTask.id)
        if (!oldTask) {
          changes.tasks.added.push(newTask)
        } else {
          if (oldTask !== newTask) {
            changes.tasks.updated.push({
              id: newTask.id,
              newValue: newTask,
            })
          }
        }
      }
    
    // detecting deleted tasks
    for (const oldTask of oldState.tasks) {
        if (!newTasksMap.has(oldTask.id)) {
          changes.tasks.deleted.push(oldTask.id);
        }
      }

    return changes
}

export function reconcileChanges (notionChanges: SyncStateChanges, googleTaskChanges: SyncStateChanges) : SyncStateChanges {

  const finalChanges: SyncStateChanges = {
    tasks: {
      added: [],
      deleted: [],
      updated: []
    },
    taskLists: {
      added: [],
      deleted: [],
      updated: []
    }
  }
//In our system, google Tasks will always have priority
  //Tasks
  googleTaskChanges.tasks.updated.forEach( update =>
    finalChanges.tasks.updated.push(update)
  )

  googleTaskChanges.tasks.deleted.forEach( deleteId =>
    finalChanges.tasks.deleted.push(deleteId)
  )
  
  googleTaskChanges.tasks.added.forEach( newTask =>
    finalChanges.tasks.added.push(newTask)
  )

  //Taskslists
  googleTaskChanges.taskLists.updated.forEach( update =>
    finalChanges.taskLists.updated.push(update)
  )

  googleTaskChanges.taskLists.deleted.forEach( deleteId =>
    finalChanges.taskLists.deleted.push(deleteId)
  )
  
  googleTaskChanges.taskLists.added.forEach( newTaskList =>
    finalChanges.taskLists.added.push(newTaskList)
  )

//Notion changes are dispatched with more care
  //Tasks
  notionChanges.tasks.updated.forEach( update => {
    //look inside the updated and deleted tasks IDs in the google tasks changes
    //if the updated task is in neither of them, then we push the change
    if (!googleTaskChanges.tasks.deleted.find( deleteId => deleteId === update.id)
      && !googleTaskChanges.tasks.updated.find( gTaskUpdate => gTaskUpdate.id === update.id)) {
      finalChanges.tasks.updated.push(update)
    }
  })

  notionChanges.tasks.deleted.forEach( deleteId => {
    if (!googleTaskChanges.tasks.updated.find( update => update.id === deleteId)
    && !googleTaskChanges.tasks.deleted.find( gTaskDeleteId => gTaskDeleteId === deleteId)) {
      finalChanges.tasks.deleted.push(deleteId)
    }
  })

  notionChanges.tasks.added.forEach( newTask => {
      //making sure we're not adding the exact same task
    if (!googleTaskChanges.tasks.added.find( task => newTask.id === task.id))
    finalChanges.tasks.added.push(newTask)
  })

  //Tasklists
  notionChanges.taskLists.updated.forEach( update => {
    if (!googleTaskChanges.taskLists.deleted.find( deleteId => deleteId === update.id)
      && !googleTaskChanges.taskLists.updated.find( gTaskUpdate => gTaskUpdate.id === update.id)) {
      finalChanges.taskLists.updated.push(update)
    }
  })

  notionChanges.taskLists.deleted.forEach( deleteId => {
    if (!googleTaskChanges.taskLists.deleted.find( gTaskDeleteId => gTaskDeleteId === deleteId)
      && !googleTaskChanges.taskLists.updated.find( gTaskUpdate => gTaskUpdate.id === deleteId)) {
        finalChanges.taskLists.deleted.push(deleteId)
    }
  })
  
  notionChanges.taskLists.added.forEach( newTaskList => {
    if (!googleTaskChanges.taskLists.added.find( list => newTaskList.id === list.id))
    finalChanges.taskLists.added.push(newTaskList)
  })

  return finalChanges
}

export function applyChangesToState (stateToUpdate: SyncState, changes: SyncStateChanges) {
  //tasklists
  changes.taskLists.added.forEach( addedList => stateToUpdate.tasklists.push(addedList))

  changes.taskLists.updated.forEach( update => {
    let foundList = stateToUpdate.tasklists.find( list => list.id === update.id)
    if (foundList) foundList = update.newValue
    else stateToUpdate.tasklists.push(update.newValue)
  })

  changes.taskLists.deleted.forEach ( idToDelete => {
    stateToUpdate.tasklists = stateToUpdate.tasklists.filter( list => list.id !== idToDelete)
  })

  //tasks
  changes.tasks.added.forEach( addedTask => stateToUpdate.tasks.push(addedTask))

  changes.tasks.updated.forEach( update => {
    let foundTask = stateToUpdate.tasks.find( task => task.id === update.id)
    if (foundTask) foundTask = update.newValue
    else stateToUpdate.tasks.push(update.newValue)
  })

  changes.tasks.deleted.forEach ( idToDelete => {
    stateToUpdate.tasks = stateToUpdate.tasks.filter( task => task.id !== idToDelete)
  })
}

function createTaskListMap(taskLists: TaskList[]): Map<string, TaskList> {
  const map = new Map<string, TaskList>();
  for (const taskList of taskLists) {
    map.set(taskList.id, taskList);
  }
  return map;
}

function createTaskMap(tasks: Task[]): Map<string, Task> {
  const map = new Map<string, Task>();
  for (const task of tasks) {
    map.set(task.id, task);
  }
  return map;
}