import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useLogin, useGoogleLogin } from '../../hooks/useAuth'
import { AuthBackground } from '../../components/auth/AuthBackground'
import { AuthCard } from '../../components/auth/AuthCard'
import { VoxelLogo } from '../../components/auth/VoxelLogo'
import { AuthInput } from '../../components/auth/AuthInput'
import { AuthButton } from '../../components/auth/AuthButton'
import { GoogleButton } from '../../components/auth/GoogleButton'
import { AuthDivider } from '../../components/auth/AuthDivider'
import { Alert } from '../../components/ui/Alert'
import { getErrorMessage } from '../../utils/errors'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loginMutation = useLogin()
  const googleMutation = useGoogleLogin()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    loginMutation.mutate({ email, password })
  }

  const handleGoogle = () => {
    // У продакшені: отримати Google ID token через Google SDK
    googleMutation.mutate('mock-google-id-token')
  }

  const isLoading = loginMutation.isPending || googleMutation.isPending
  const errorMsg = loginMutation.isError
    ? getErrorMessage(loginMutation.error)
    : googleMutation.isError
      ? getErrorMessage(googleMutation.error)
      : null

  return (
    <AuthBackground>
      {/* На скріні "Welcome back" немає стрілки назад — це вхідний екран флоу */}
      <AuthCard>
        <div className="flex flex-col items-center">
          <VoxelLogo className="mb-5" />
          <h1 className="text-xl font-bold text-voxel-black">Welcome back</h1>
        </div>

        <div>
          {errorMsg && <Alert type="error" message={errorMsg} className="mb-4" />}

          <GoogleButton label="Login with Google account" onClick={handleGoogle} disabled={isLoading} />

          <AuthDivider className="my-4" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthInput
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
              required
            />
            <div className="flex flex-col gap-1.5">
              <AuthInput
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
              <Link
                to="/recovery"
                className="self-end text-xs font-medium text-voxel-gray-dark underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <AuthButton active={email.length > 0 && password.length > 0} isLoading={loginMutation.isPending}>
              Continue
            </AuthButton>
          </form>

          <p className="mt-6 text-center text-sm text-voxel-gray-dark">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
          <p className="mt-2 text-center text-sm text-voxel-black">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold underline">
              Sign up
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthBackground>
  )
}
