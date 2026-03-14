export function getItem<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key)
    if (value === null) return null
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function setItem<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeItem(key: string): void {
  window.localStorage.removeItem(key)
}
