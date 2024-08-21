
export interface Task {
    id: string,
    title: string,
    selfLink?: string,
    status: string,
    due?: string,
    completed?: string,
    deleted: boolean
}

export interface TaskList {
    id: string,
    title: string,
    selfLink?: string
}