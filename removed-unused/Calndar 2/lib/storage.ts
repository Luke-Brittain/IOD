export const KEY = 'calendar-tasks-v1'

export function loadTasks(): Record<string, any[]> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

export function saveTasks(data: Record<string, any[]>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch (e) {
    // ignore
  }
}
