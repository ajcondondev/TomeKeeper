import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/Layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LibraryPage } from '@/pages/LibraryPage'
import { ReadingListPage } from '@/pages/ReadingListPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useAuthStore } from '@/store/authStore'
import { USE_MOCK_API } from '@/config/env'

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth)

  useEffect(() => {
    if (!USE_MOCK_API) {
      void initializeAuth()
    }
  }, [initializeAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="reading-list" element={<ReadingListPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
