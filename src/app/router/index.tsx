import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/main-layout'
import { AuthGuard } from '../auth-guard'

// Pages
import { LoginPage } from '@pages/login'
import { DashboardPage } from '@pages/dashboard'
import { VideoStreamPage } from '@pages/video-stream'
import { CameraSettingsPage } from '@pages/camera-settings'
import { AiSettingsPage } from '@pages/ai-settings'
import { SettingsPage } from '@pages/settings'
import { StatisticsPage } from '@pages/statistics'
import { PlcPage } from '@pages/plc'

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
        path: 'cameraSettings',
        element: <CameraSettingsPage />,
      },
      {
        path: 'aiSettings',
        element: <AiSettingsPage />,
      },
      {
        path: 'systemInfo',
        element: <SettingsPage />,
      },
      {
        path: 'statistics',
        element: <StatisticsPage />,
      },
      {
        path: 'plc',
        element: <PlcPage />,
      },
    ],
  },
])
