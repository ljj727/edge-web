import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  Brain,
  Settings,
  ClipboardList,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { useAuthStore, useLogout } from '@features/auth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/videoStream', icon: Video, label: 'Video Stream' },
  { to: '/visionApp', icon: Brain, label: 'Vision App' },
  { to: '/eventLog', icon: ClipboardList, label: 'Event Log' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { to: '/systemInfo', icon: Settings, label: 'Settings' },
]

export function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Edge DX</h1>
        </div>
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{user?.username || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.role || 'admin'}</p>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
