import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/main-layout'
import { AuthGuard } from '../auth-guard'

// Pages
import { LoginPage } from '@pages/login'
import { DashboardPage } from '@pages/dashboard'
import { VideoStreamPage } from '@pages/video-stream'
import { AnalyticsPage } from '@pages/analytics'
import { SettingsPage } from '@pages/settings'
import { StatisticsPage } from '@pages/statistics'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'videoStream',
        element: <VideoStreamPage />,
      },
      {
        path: 'videoStream/:videoName',
        element: <VideoStreamPage />,
      },
      {
        path: 'visionApp',
        element: <AnalyticsPage />,
      },
      {
        path: 'systemInfo',
        element: <SettingsPage />,
      },
      {
        path: 'statistics',
        element: <StatisticsPage />,
      },
    ],
  },
])
