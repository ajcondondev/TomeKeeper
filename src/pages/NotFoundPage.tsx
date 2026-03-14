import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-6xl font-bold text-gray-200">404</h2>
      <p className="text-gray-500">Page not found.</p>
      <Link to="/library" className="text-indigo-600 hover:underline">
        Back to My Library
      </Link>
    </div>
  )
}
