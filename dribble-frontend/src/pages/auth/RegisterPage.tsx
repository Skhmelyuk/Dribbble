import { useState } from 'react'
import { Link } from 'react-router'
import { AuthBackground } from '../../components/auth/AuthBackground'
import { AuthCard } from '../../components/auth/AuthCard'
import { VoxelLogo } from '../../components/auth/VoxelLogo'
import { AuthInput } from '../../components/auth/AuthInput'
import { AuthButton } from '../../components/auth/AuthButton'
import { GoogleButton } from '../../components/auth/GoogleButton'
import { AuthDivider } from '../../components/auth/AuthDivider'
import { OtpStep } from '../../components/auth/steps/OtpStep'
import { NewPasswordStep } from '../../components/auth/steps/NewPasswordStep'
import { ProfileStep } from '../../components/auth/steps/ProfileStep'
import { Alert } from '../../components/ui/Alert'
import { useCompleteRegistration, useGoogleLogin } from '../../hooks/useAuth'
import { getErrorMessage, getErrorField } from '../../utils/errors'

type Step = 'email' | 'otp' | 'password' | 'profile'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const RegisterPage = () => {
  const [step, setStep] = useState<Step>('email')
  const [emailError, setEmailError] = useState<string | null>(null)

  // Wizard state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const completeRegistration = useCompleteRegistration()
  const googleMutation = useGoogleLogin()

  // ─── Крок 1: Email ──────────────────────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setEmailError('Введіть коректну email адресу.')
      return
    }
    setEmailError(null)
    setStep('otp')
  }

  const handleGoogle = () => {
    googleMutation.mutate('mock-google-id-token')
  }

  // ─── Крок 4: фінальна відправка ────────────────────────────────────────
  const handleProfileSubmit = () => {
    completeRegistration.mutate(
      {
        email,
        username: fullName.trim(),
        password,
        password2: confirmPassword,
        avatar: avatarFile,
        location: location.trim() || undefined,
      },
      {
        onError: (err) => {
          const field = getErrorField(err)
          if (field === 'email') setStep('email')
          else if (field === 'password' || field === 'password2') setStep('password')
          // 'username' (full name) і решта помилок лишаються на кроці profile
        },
      }
    )
  }

  const registrationError = completeRegistration.isError ? getErrorMessage(completeRegistration.error) : null
  const googleError = googleMutation.isError ? getErrorMessage(googleMutation.error) : null

  // ─── Крок: Email ────────────────────────────────────────────────────────
  if (step === 'email') {
    return (
      <AuthBackground>
        <AuthCard>
          <div className="flex flex-col items-center">
            <VoxelLogo className="mb-5" />
            <h1 className="text-xl font-bold text-voxel-black">Welcome to Voxel</h1>
            <p className="mt-2 text-center text-sm text-voxel-gray-dark">
              Create your account and discover world-class design talent.
            </p>
          </div>

          <div>
            {(emailError || googleError) && (
              <Alert type="error" message={emailError ?? googleError ?? ''} className="mb-4" />
            )}

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <AuthInput
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <AuthButton active={email.length > 0}>Continue</AuthButton>
            </form>

            <AuthDivider className="my-4" />

            <GoogleButton
              label="Login with Google account"
              onClick={handleGoogle}
              disabled={googleMutation.isPending}
            />

            <p className="mt-6 text-center text-xs text-voxel-gray-dark">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
            <p className="mt-2 text-center text-sm text-voxel-black">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold underline">
                Sign in
              </Link>
            </p>
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

  // ─── Крок: Створення пароля ─────────────────────────────────────────────
  if (step === 'password') {
    return (
      <AuthBackground>
        <NewPasswordStep
          title="Create your password"
          password={password}
          onPasswordChange={setPassword}
          confirmPassword={confirmPassword}
          onConfirmChange={setConfirmPassword}
          confirmPlaceholder="Confirm your password"
          submitLabel="Continue"
          onBack={() => setStep('otp')}
          onSubmit={() => setStep('profile')}
        />
      </AuthBackground>
    )
  }

  // ─── Крок: Профіль ──────────────────────────────────────────────────────
  return (
    <AuthBackground>
      <ProfileStep
        fullName={fullName}
        onFullNameChange={setFullName}
        location={location}
        onLocationChange={setLocation}
        avatarPreview={avatarPreview}
        onAvatarChange={(file) => {
          setAvatarFile(file)
          setAvatarPreview(URL.createObjectURL(file))
        }}
        onBack={() => setStep('password')}
        onSubmit={handleProfileSubmit}
        isLoading={completeRegistration.isPending}
        error={registrationError}
      />
    </AuthBackground>
  )
}
