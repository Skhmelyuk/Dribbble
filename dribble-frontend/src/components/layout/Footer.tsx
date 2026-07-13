import { Link } from 'react-router'
import logo from '../../assets/voxel-logo.png'

const FOR_DESIGNERS_LINKS = ['Blog', 'About', 'Support']

const COLUMN_1 = ['Jobs', 'Places', 'Resources', 'Tags']
const COLUMN_2 = ['Freelancers', 'Designers']

export const Footer = () => {
  return (
    <footer className="bg-surface-alt mt-auto">
      <div className="max-w-[110rem] mx-auto px-6 sm:px-10 py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Логотип + навігація "For designers" */}
          <div className="flex flex-col gap-8">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="" className="h-8 w-8" draggable={false} />
              <span className="font-script text-2xl text-ink">Voxel</span>
            </Link>

            <nav className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-bold text-ink">For designers</span>
              {FOR_DESIGNERS_LINKS.map((label) => (
                <a key={label} href="#" className="text-sm font-bold text-ink hover:text-primary transition-colors">
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Колонки посилань */}
          <div className="flex flex-wrap gap-10 sm:gap-16">
            <div className="flex flex-col gap-3">
              {COLUMN_1.map((label) => (
                <a key={label} href="#" className="text-sm font-semibold text-muted hover:text-ink transition-colors">
                  {label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {COLUMN_2.map((label) => (
                <a key={label} href="#" className="text-sm font-semibold text-muted hover:text-ink transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Соцмережі */}
          <div className="flex items-center gap-3">
            {['adobe', 'youtube', 'google', 'instagram'].map((name) => (
              <a
                key={name}
                href="#"
                aria-label={name}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-ink hover:bg-white transition-colors"
              >
                <SocialIcon name={name} />
              </a>
            ))}
          </div>
        </div>

        {/* Низ футера */}
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-muted">
          <span>@2026 Voxel</span>
          <span className="inline-flex items-center gap-1">
            <CookieIcon /> Cookies
          </span>
          <span>Privacy</span>
        </div>
      </div>
    </footer>
  )
}

const CookieIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a9.96 9.96 0 00-7.07 2.93A9.96 9.96 0 002 12a10 10 0 1010-10z" />
    <circle cx="9" cy="10" r="1" fill="currentColor" />
    <circle cx="13" cy="14" r="1" fill="currentColor" />
    <circle cx="10" cy="16" r="1" fill="currentColor" />
  </svg>
)

const SocialIcon = ({ name }: { name: string }) => {
  switch (name) {
    case 'adobe':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5 4L2 20h4.2l1.2-3.2h6.2L14.8 20H19L12.5 4H8.5zm.9 9.2L11.5 8l2.1 5.2H9.4z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12s0-3.2-.4-4.7c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.5c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.7c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.5c.9-.2 1.6-.9 1.8-1.8.4-1.5.4-4.7.4-4.7zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      )
    case 'google':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.6 12.23c0-.7-.06-1.38-.18-2.03H12v3.84h5.4a4.6 4.6 0 01-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.33z" />
          <path d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.24-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H3.05v2.58A10 10 0 0012 22z" />
          <path d="M6.4 13.9a6 6 0 010-3.8V7.52H3.05a10 10 0 000 8.96l3.36-2.58z" />
          <path d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0012 2a10 10 0 00-8.95 5.52L6.4 10.1C7.2 7.74 9.4 5.98 12 5.98z" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.7 4.92 4.92.06 1.27.07 1.64.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.22-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.64-.07 4.85-.07zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.4-8.4a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
        </svg>
      )
  }
}