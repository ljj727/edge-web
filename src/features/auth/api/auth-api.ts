import { api } from '@shared/api/client'
import type { LoginRequest, LoginResponse } from '@shared/types'

const AUTH_ENDPOINT = '/v2/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>(AUTH_ENDPOINT, data),
}
