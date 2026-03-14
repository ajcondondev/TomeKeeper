import { BookOpen } from 'lucide-react'

export function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-indigo-600" />
        <span className="text-xl font-semibold text-gray-900">TomeKeeper</span>
      </div>
    </header>
  )
}
