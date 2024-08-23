
export interface Task {
    id: string,
    title: string,
    selfLink?: string,
    status: string,
    due?: string,
    completed?: string
}

export interface TaskList {
    id: string,
    title: string,
    selfLink?: string
}