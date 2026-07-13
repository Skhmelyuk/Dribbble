import { AuthCard } from '../AuthCard'
import { VoxelLogo } from '../VoxelLogo'
import { AuthInput } from '../AuthInput'
import { AuthButton } from '../AuthButton'
import { AvatarPicker } from '../AvatarPicker'
import { Alert } from '../../ui/Alert'

interface ProfileStepProps {
  fullName: string
  onFullNameChange: (v: string) => void
  location: string
  onLocationChange: (v: string) => void
  avatarPreview: string | null
  onAvatarChange: (file: File) => void
  onBack: () => void
  onSubmit: () => void
  isLoading?: boolean
  error?: string | null
}

export const ProfileStep = ({
  fullName,
  onFullNameChange,
  location,
  onLocationChange,
  avatarPreview,
  onAvatarChange,
  onBack,
  onSubmit,
  isLoading,
  error,
}: ProfileStepProps) => {
  const isFilled = fullName.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFilled) return
    onSubmit()
  }

  return (
    <AuthCard onBack={onBack}>
      <div className="flex flex-col items-center">
        <VoxelLogo className="mb-3" />
        <h1 className="text-xl font-bold text-voxel-black">Tell us about yourself</h1>
      </div>

      <div>
        {error && <Alert type="error" message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AvatarPicker preview={avatarPreview} onChange={onAvatarChange} disabled={isLoading} />

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="fullName" className="text-[0.9375rem] font-semibold text-[#1A202C]">
              Full name*
            </label>
            <AuthInput
              id="fullName"
              type="text"
              placeholder="Enter your name"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              autoComplete="name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="location" className="text-[0.9375rem] font-semibold text-[#1A202C]">
              Location
            </label>
            <AuthInput
              id="location"
              type="text"
              placeholder="Enter your location"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              autoComplete="address-level2"
              disabled={isLoading}
            />
          </div>

          <AuthButton active={isFilled} isLoading={isLoading} className="mt-2">
            Continue
          </AuthButton>
        </form>
      </div>
    </AuthCard>
  )
}
