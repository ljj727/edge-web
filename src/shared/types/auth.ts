export interface User {
  id: string
  username: string
  email?: string
  role: 'admin' | 'user' | 'viewer'
}

export interface LoginRequest {
  id: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}
