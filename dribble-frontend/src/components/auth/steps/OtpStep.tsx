import { useEffect, useState } from 'react'
import { AuthCard } from '../AuthCard'
import { VoxelLogo } from '../VoxelLogo'
import { OtpInput } from '../OtpInput'
import { AuthButton } from '../AuthButton'
import { Alert } from '../../ui/Alert'
import { maskEmail } from '../../../utils/email'

const CODE_LENGTH = 7
const RESEND_COOLDOWN = 60

interface OtpStepProps {
  email: string
  title?: string
  onBack: () => void
  onSubmit: () => void
  onUsePassword: () => void
  isLoading?: boolean
  error?: string | null
}

export const OtpStep = ({
  email,
  title = "Confirm it's you",
  onBack,
  onSubmit,
  onUsePassword,
  isLoading,
  error,
}: OtpStepProps) => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const isComplete = code.every((digit) => digit !== '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isComplete) {
      setLocalError('Введіть усі 7 цифр коду.')
      return
    }
    setLocalError(null)
    onSubmit()
  }

  const handleResend = () => {
    if (cooldown > 0) return
    setCooldown(RESEND_COOLDOWN)
  }

  return (
    <AuthCard onBack={onBack}>
      <div className="flex flex-col items-center">
        <VoxelLogo className="mb-5" />
        <h1 className="text-xl font-bold text-voxel-black">{title}</h1>
        <p className="mt-2 max-w-[20rem] text-center text-sm text-voxel-gray-dark">
          We've sent you a passcode.
          <br />
          Please check your inbox at {maskEmail(email)}.
        </p>
      </div>

      <div>
        {(error || localError) && <Alert type="error" message={error ?? localError ?? ''} className="mb-4" />}

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          <OtpInput length={CODE_LENGTH} value={code} onChange={setCode} disabled={isLoading} />

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="text-sm text-voxel-gray-dark underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60 cursor-pointer disabled:cursor-default"
          >
            {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
          </button>

          <AuthButton active={isComplete} isLoading={isLoading} className="mt-1">
            Continue
          </AuthButton>
        </form>

        <p className="mt-4 text-center text-sm text-voxel-black">
          Can't find your code?{' '}
          <button type="button" onClick={onUsePassword} className="font-semibold underline cursor-pointer">
            Use password
          </button>
        </p>
      </div>
    </AuthCard>
  )
}
