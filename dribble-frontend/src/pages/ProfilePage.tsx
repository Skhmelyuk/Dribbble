import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import { getErrorMessage } from '../utils/errors'

//Stat Card
const StatCard = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-2xl font-extrabold text-ink">{value}</span>
    <span className="text-xs text-muted uppercase tracking-wider font-medium">{label}</span>
  </div>
)

//Social Input
const SocialInput = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder: string
  disabled: boolean
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-muted tracking-wider uppercase">
      {label}
    </label>
    <div className="relative flex items-center">
      <div className="absolute left-4 text-muted pointer-events-none">{icon}</div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-2xl bg-white border border-border pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
      />
    </div>
  </div>
)

//Social icons
const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const WebIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

//Main component
export const ProfilePage = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const { data: profile, isLoading } = useProfile()
  const updateMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()

  //Local form state
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  //Password change form state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  //Синхронізація форми з даними профілю — виконується один раз, коли профіль щойно завантажився
  const [hydratedForId, setHydratedForId] = useState<number | null>(null)
  if (profile && profile.id !== hydratedForId) {
    setHydratedForId(profile.id)
    setBio(profile.bio ?? '')
    setWebsite(profile.website ?? '')
    setTwitter(profile.twitter ?? '')
    setInstagram(profile.instagram ?? '')
    setLinkedin(profile.linkedin ?? '')
    setAvatarPreview(profile.avatar)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    updateMutation.mutate(
      { bio, website, twitter, instagram, linkedin, avatar: avatarFile },
      {
        onSuccess: () => {
          setSuccessMsg('Профіль успішно оновлено!')
          setAvatarFile(null)
          setTimeout(() => setSuccessMsg(''), 4000)
        },
      }
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== newPassword2) {
      setPasswordError('Нові паролі не співпадають.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Пароль має містити щонайменше 8 символів.')
      return
    }

    changePasswordMutation.mutate(
      { old_password: oldPassword, new_password: newPassword, new_password2: newPassword2 },
      {
        onSuccess: () => {
          setPasswordSuccess('Пароль успішно змінено!')
          setOldPassword('')
          setNewPassword('')
          setNewPassword2('')
          setTimeout(() => setPasswordSuccess(''), 4000)
        },
        onError: (err) => setPasswordError(getErrorMessage(err)),
      }
    )
  }

  //Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Profile header */}
      <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-2xl shadow-black/5 mb-6">
        {/* Banner */}
        <div className="h-28 bg-linear-to-br from-primary/10 via-surface-alt to-white" />

        {/* Avatar + meta */}
        <div className="px-8 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile?.username}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary/10 border-4 border-white flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-primary">
                    {profile?.username?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
              )}
              {/* Edit avatar overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                aria-label="Змінити фото профілю"
              >
                <svg className="w-6 h-6 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Завантажити аватар"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Вийти
            </Button>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-ink">
              {profile?.username}
            </h1>
            <p className="text-sm text-muted">{profile?.email}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-5 pt-5 border-t border-border">
            <StatCard value={profile?.shots_count ?? 0} label="Робіт" />
            <div className="w-px h-8 bg-surface-alt" />
            <StatCard value={profile?.followers_count ?? 0} label="Підписники" />
            <div className="w-px h-8 bg-surface-alt" />
            <StatCard value={profile?.following_count ?? 0} label="Підписки" />
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white border border-border rounded-3xl p-8 shadow-2xl shadow-black/5">
        <h2 className="text-lg font-bold text-ink mb-6">Редагувати профіль</h2>

        {successMsg && (
          <Alert type="success" message={successMsg} className="mb-6" />
        )}
        {updateMutation.isError && (
          <Alert
            type="error"
            message="Не вдалося зберегти. Спробуйте ще раз."
            className="mb-6"
          />
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ім'я користувача"
              value={profile?.username ?? ''}
              disabled
              className="opacity-50"
              readOnly
            />
            <Input
              label="Email"
              value={profile?.email ?? ''}
              disabled
              className="opacity-50"
              readOnly
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted tracking-wider uppercase">
              Про себе
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              disabled={updateMutation.isPending}
              rows={3}
              placeholder="Розкажіть про свої проєкти та досвід..."
              className="w-full rounded-2xl bg-surface-alt border border-border px-4 py-3 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all duration-200 resize-none disabled:opacity-50"
            />
            <span className="text-xs text-muted/60 text-right">{bio.length}/500</span>
          </div>

          {/* Social links */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-muted tracking-wider uppercase">
              Соціальні мережі
            </span>
            <SocialInput
              label="Вебсайт"
              icon={<WebIcon />}
              value={website}
              onChange={setWebsite}
              placeholder="https://myportfolio.com"
              disabled={updateMutation.isPending}
            />
            <SocialInput
              label="Twitter / X"
              icon={<TwitterIcon />}
              value={twitter}
              onChange={setTwitter}
              placeholder="https://twitter.com/username"
              disabled={updateMutation.isPending}
            />
            <SocialInput
              label="Instagram"
              icon={<InstagramIcon />}
              value={instagram}
              onChange={setInstagram}
              placeholder="https://instagram.com/username"
              disabled={updateMutation.isPending}
            />
            <SocialInput
              label="LinkedIn"
              icon={<LinkedInIcon />}
              value={linkedin}
              onChange={setLinkedin}
              placeholder="https://linkedin.com/in/username"
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Avatar upload button */}
          <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-2xl border border-border">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Preview"
                className="w-12 h-12 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">
                {avatarFile ? avatarFile.name : 'Фото профілю'}
              </p>
              <p className="text-xs text-muted">
                {avatarFile
                  ? `${(avatarFile.size / 1024).toFixed(0)} KB`
                  : 'PNG, JPG, WEBP до 5 MB'}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Обрати
            </Button>
          </div>

          <Button
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            className="w-full"
            size="lg"
          >
            Зберегти зміни
          </Button>
        </form>
      </div>

      {/* Зміна паролю*/}
      <div className="bg-white border border-border rounded-3xl p-8 shadow-2xl shadow-black/5 mt-6">
        <h2 className="text-lg font-bold text-ink mb-6">Зміна паролю</h2>

        {passwordSuccess && <Alert type="success" message={passwordSuccess} className="mb-6" />}
        {passwordError && <Alert type="error" message={passwordError} className="mb-6" />}

        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <Input
            label="Поточний пароль"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
            disabled={changePasswordMutation.isPending}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Новий пароль"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={changePasswordMutation.isPending}
              required
            />
            <Input
              label="Підтвердіть новий пароль"
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              autoComplete="new-password"
              disabled={changePasswordMutation.isPending}
              required
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            isLoading={changePasswordMutation.isPending}
            disabled={changePasswordMutation.isPending}
            className="w-full sm:w-auto sm:self-start"
          >
            Змінити пароль
          </Button>
        </form>
      </div>
    </div>
  )
}
