import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button, Input } from '@shared/ui'
import { useLogin } from '@features/auth'

const loginSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      id: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-card rounded-lg border p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Edge System</h1>
            <p className="text-muted-foreground mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID</label>
              <Input
                {...register('id')}
                placeholder="Enter ID"
                disabled={login.isPending}
                autoComplete="username"
              />
              {errors.id && (
                <p className="text-sm text-red-500">{errors.id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                {...register('password')}
                type="password"
                placeholder="Enter password"
                disabled={login.isPending}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {login.isError && (
              <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-lg text-sm">
                Invalid ID or password
              </div>
            )}

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full"
            >
              {login.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
