import { Outlet } from 'react-router'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export const Layout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-app">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
