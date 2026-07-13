import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AuthBackground } from '../../components/auth/AuthBackground'
import { AuthCard } from '../../components/auth/AuthCard'
import { VoxelLogo } from '../../components/auth/VoxelLogo'
import { AuthInput } from '../../components/auth/AuthInput'
import { AuthButton } from '../../components/auth/AuthButton'
import { OtpStep } from '../../components/auth/steps/OtpStep'
import { NewPasswordStep } from '../../components/auth/steps/NewPasswordStep'
import { Alert } from '../../components/ui/Alert'
import { usePasswordResetRequest, usePasswordResetConfirm, useGoogleLogin } from '../../hooks/useAuth'
import { getErrorMessage, isNotImplemented } from '../../utils/errors'

type Step = 'email' | 'otp' | 'password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const RecoveryPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  const resetRequest = usePasswordResetRequest()
  const resetConfirm = usePasswordResetConfirm()
  const googleMutation = useGoogleLogin()

  // ─── Крок: Email ────────────────────────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setFormError('Введіть коректну email адресу.')
      return
    }
    setFormError(null)

    resetRequest.mutate(email, {
      onSuccess: () => setStep('otp'),
      onError: (err) => {
        if (isNotImplemented(err)) {
          // Бекенд ще не реалізував відновлення пароля (Фаза 0 контракту
          // цей ендпоінт не описує). UI лишається коректним і готовим до
          // підключення без змін, щойно ендпоінт з'явиться.
          setFormError(
            'Функція відновлення пароля поки не підтримується сервером. Зверніться до підтримки або спробуйте пізніше.'
          )
        } else {
          setFormError(getErrorMessage(err))
        }
      },
    })
  }

  const handleUseGoogle = () => {
    googleMutation.mutate('mock-google-id-token')
  }

  // ─── Крок: Нове password ────────────────────────────────────────────────
  const handlePasswordSubmit = () => {
    resetConfirm.mutate(
      { email, password, password2: confirmPassword },
      {
        onSuccess: () => {
          setInfoMsg('Пароль успішно змінено. Тепер ви можете увійти.')
          navigate('/login')
        },
        onError: (err) => {
          if (isNotImplemented(err)) {
            setFormError(
              'Функція відновлення пароля поки не підтримується сервером. Зверніться до підтримки або спробуйте пізніше.'
            )
          } else {
            setFormError(getErrorMessage(err))
          }
        },
      }
    )
  }

  // ─── Крок: Email ────────────────────────────────────────────────────────
  if (step === 'email') {
    return (
      <AuthBackground>
        <AuthCard onBack={() => navigate('/login')}>
          <div className="flex flex-col items-center">
            <VoxelLogo className="mb-5" />
            <h1 className="text-xl font-bold text-voxel-black">Recovery your password</h1>
          </div>

          <div>
            {formError && <Alert type="error" message={formError} className="mb-4" />}
            {infoMsg && <Alert type="success" message={infoMsg} className="mb-4" />}

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <AuthInput
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={resetRequest.isPending}
                required
              />
              <AuthButton active={email.length > 0} isLoading={resetRequest.isPending}>
                Send
              </AuthButton>
            </form>

            <button
              type="button"
              onClick={handleUseGoogle}
              disabled={googleMutation.isPending}
              className="mt-4 w-full text-center text-sm font-medium text-voxel-gray-dark underline-offset-2 hover:underline cursor-pointer disabled:opacity-50"
            >
              Use Google
            </button>
          </div>
        </AuthCard>
      </AuthBackground>
    )
  }

  // ─── Крок: OTP підтвердження ────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <AuthBackground>
        <OtpStep
          email={email}
          onBack={() => setStep('email')}
          onSubmit={() => setStep('password')}
          onUsePassword={() => setStep('password')}
        />
      </AuthBackground>
    )
  }

  // ─── Крок: Новий пароль ─────────────────────────────────────────────────
  return (
    <AuthBackground>
      <NewPasswordStep
        title="Create a new password"
        password={password}
        onPasswordChange={setPassword}
        confirmPassword={confirmPassword}
        onConfirmChange={setConfirmPassword}
        passwordPlaceholder="Enter a new password"
        confirmPlaceholder="Confirm password"
        submitLabel="Send"
        onBack={() => setStep('otp')}
        onSubmit={handlePasswordSubmit}
        isLoading={resetConfirm.isPending}
        error={formError}
        footer={
          <button
            type="button"
            onClick={handleUseGoogle}
            className="font-medium text-voxel-gray-dark underline-offset-2 hover:underline cursor-pointer"
          >
            Use Google
          </button>
        }
      />
    </AuthBackground>
  )
}
