import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  Brain,
  Settings,
  ClipboardList,
  BarChart3,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { useAuthStore, useLogout } from '@features/auth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/videoStream', icon: Video, label: 'Video Stream' },
  { to: '/visionApp', icon: Brain, label: 'Vision Apps' },
  { to: '/eventLog', icon: ClipboardList, label: 'Event Log' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { to: '/systemInfo', icon: Settings, label: 'Settings' },
]

export function MainLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b bg-card flex items-center px-6 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DX</span>
          </div>
          <h1 className="text-lg font-semibold">Edge DX</h1>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user?.username || 'User'}</span>
            <span className="text-xs text-muted-foreground">({user?.role || 'admin'})</span>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
