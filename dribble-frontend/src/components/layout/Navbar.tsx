import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, Search, Globe } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import logo from '../../assets/voxel-logo.png'

const NAV_ITEMS = [
  { label: 'Categories', to: '/feed' },
  { label: 'Community', to: '/feed' },
  { label: 'Find a job', to: '/feed' },
]

export const Navbar = () => {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border font-app">
      <div className="max-w-[110rem] mx-auto px-6 sm:px-10 h-20 flex items-center gap-6">
        {/* Логотип */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <img src={logo} alt="" className="h-9 w-9" draggable={false} />
          <span className="font-script text-2xl text-ink -mt-1">Voxel</span>
        </Link>

        {/* Категорії / спільнота / робота */}
        <nav className="hidden lg:flex items-center gap-1 shrink-0">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold text-ink hover:bg-surface-alt transition-colors"
            >
              {item.label}
              <ChevronDown className="w-3.5 h-3.5" />
            </Link>
          ))}
        </nav>

        {/* Пошук */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink" />
            <input
              type="text"
              placeholder="Find a style"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border-2 border-ink bg-white pl-11 pr-4 py-2.5 text-sm text-ink placeholder:text-[#3E3E3E] focus:outline-none"
            />
          </div>
        </form>

        {/* Дії справа */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {user ? (
            <>
              <Link
                to="/upload"
                className="hidden sm:block px-3 py-1.5 rounded-full text-sm font-semibold text-ink hover:bg-surface-alt transition-colors"
              >
                Опублікувати
              </Link>
              <Link to={`/users/${user.username}`}>
                <div className="flex items-center gap-2.5 px-2 py-1 rounded-full hover:bg-surface-alt transition-colors">
                  <Avatar src={user.avatar} username={user.username} className="w-9 h-9" textClassName="text-xs" />
                  <span className="hidden sm:block text-sm font-semibold text-ink">{user.username}</span>
                </div>
              </Link>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Вийти
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink hover:text-primary transition-colors px-2">
                Log in
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}

          <button
            type="button"
            aria-label="Мова"
            className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-ink hover:bg-surface-alt transition-colors"
          >
            <Globe className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}