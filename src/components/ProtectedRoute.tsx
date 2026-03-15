import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { USE_MOCK_API } from '@/config/env'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)

  // Mock mode is auth-free — always render
  if (USE_MOCK_API) return <>{children}</>

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
