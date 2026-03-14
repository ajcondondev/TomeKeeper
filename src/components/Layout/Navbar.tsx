import { BookOpen, Library, BookMarked } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/library', label: 'Library', icon: Library },
  { to: '/reading-list', label: 'Reading List', icon: BookMarked },
]

export function Navbar() {
  return (
    <header className="shrink-0 border-b border-gray-200 bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-6 py-4">
        <BookOpen className="h-6 w-6 text-indigo-600" />
        <span className="text-xl font-semibold text-gray-900">TomeKeeper</span>
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
