import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { authApi } from '../api/auth-api'
import type { LoginRequest } from '@shared/types'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response, variables) => {
      // Create user from login id since backend doesn't return user info
      const user = {
        id: variables.id,
        username: variables.id,
        role: 'admin' as const,
      }
      setAuth(user, response.token)
      navigate('/')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return { mutate: handleLogout }
}
