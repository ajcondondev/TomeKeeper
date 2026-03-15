import { useState } from 'react'
import { BookOpen, Library, BookMarked, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/reading-list', label: 'Reading List', icon: BookMarked },
]

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
    // No navigate() here — ProtectedRoute redirects to /login when user becomes null
  }

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-6 py-4">
        <BookOpen className="h-6 w-6 text-indigo-600" />
        <span className="flex-1 text-xl font-semibold text-gray-900">TomeKeeper</span>

        {/* Mobile logout — only shown when authenticated */}
        {user && (
          <button
            onClick={() => { void handleLogout() }}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mobile-only nav tabs — hidden on md+ where the sidebar takes over */}
      <nav className="flex border-t border-gray-100 md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-800',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
