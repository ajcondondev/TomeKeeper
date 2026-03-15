import { create } from 'zustand'
import { API_BASE_URL } from '@/config/env'
import { useBooksStore } from './booksStore'

interface User {
  id: string
  email: string
}

interface AuthState {
  user: User | null
  isInitializing: boolean
  initializeAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

async function authFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/auth${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitializing: true,

  initializeAuth: async () => {
    try {
      const res = await authFetch('/me')
      if (res.ok) {
        const body = (await res.json()) as { data: User }
        set({ user: body.data, isInitializing: false })
      } else {
        // Don't overwrite user here — register/login may have completed while
        // this stale /me request was in-flight. Only mark initializing as done.
        set((state) => ({ user: state.user, isInitializing: false }))
      }
    } catch {
      set((state) => ({ user: state.user, isInitializing: false }))
    }
  },

  login: async (email: string, password: string) => {
    const res = await authFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const body = (await res.json()) as { data?: User; message?: string }
    if (!res.ok) {
      throw new Error(body.message ?? 'Login failed')
    }
    set({ user: body.data ?? null })
  },

  register: async (email: string, password: string) => {
    const res = await authFetch('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const body = (await res.json()) as { data?: User; message?: string }
    if (!res.ok) {
      throw new Error(body.message ?? 'Registration failed')
    }
    set({ user: body.data ?? null })
  },

  logout: async () => {
    // Always clear local state regardless of whether the API call succeeds.
    // A failed server-side session destroy is not a reason to keep the user logged in locally.
    try {
      await authFetch('/logout', { method: 'POST' })
    } finally {
      set({ user: null })
      useBooksStore.setState({ books: [], status: 'idle', error: null })
    }
  },
}))
