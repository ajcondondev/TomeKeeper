export const USE_MOCK_API: boolean =
  import.meta.env.VITE_USE_MOCK_API === 'true'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
