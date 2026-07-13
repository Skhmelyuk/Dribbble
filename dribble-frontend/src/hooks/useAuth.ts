import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { authApi, api } from '../api'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

// useLogin
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data: tokens } = await authApi.login(credentials)

      const { data: profile } = await api.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${tokens.access}` },
      })

      return { tokens, profile }
    },
    onSuccess: ({ tokens, profile }) => {
      setAuth(profile as User, tokens.access, tokens.refresh)
      navigate('/profile')
    },
  })
}

// useCompleteRegistration
export const useCompleteRegistration = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (payload: {
      email: string
      username: string
      password: string
      password2: string
      avatar?: File | null
      location?: string
    }) => {
      await authApi.register({
        email: payload.email,
        username: payload.username,
        password: payload.password,
        password2: payload.password2,
      })

      const { data: tokens } = await authApi.login({
        email: payload.email,
        password: payload.password,
      })

      let { data: profile } = await api.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${tokens.access}` },
      })

      if (payload.avatar || payload.location) {
        const formData = new FormData()
        if (payload.avatar) formData.append('avatar', payload.avatar)
        if (payload.location) formData.append('bio', payload.location)

        const { data: updated } = await api.patch('/auth/profile/', formData, {
          headers: { Authorization: `Bearer ${tokens.access}` },
        })
        profile = updated
      }

      return { tokens, profile }
    },
    onSuccess: ({ tokens, profile }) => {
      setAuth(profile as User, tokens.access, tokens.refresh)
      navigate('/profile')
    },
  })
}

// usePasswordResetRequest / usePasswordResetConfirm
export const usePasswordResetRequest = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await authApi.requestPasswordReset(email)
      return data
    },
  })
}

export const usePasswordResetConfirm = () => {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; password2: string }) => {
      const { data } = await authApi.confirmPasswordReset(payload)
      return data
    },
  })
}

// useGoogleLogin
export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (token: string) => {
      const { data: oauthData } = await authApi.googleLogin(token)

      const { data: profile } = await api.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${oauthData.access}` },
      })

      return { oauthData, profile }
    },
    onSuccess: ({ oauthData, profile }) => {
      setAuth(profile as User, oauthData.access, oauthData.refresh)
      navigate('/profile')
    },
  })
}

// useProfile
export const useProfile = () => {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await authApi.getProfile()
      return data as User
    },
    initialData: user ?? undefined,
    staleTime: 1000 * 60 * 5,
  })
}

// useChangePassword
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: { old_password: string; new_password: string; new_password2: string }) => {
      const { data } = await authApi.changePassword(payload)
      return data
    },
  })
}

// useUpdateProfile
export const useUpdateProfile = () => {
  const updateUser = useAuthStore((state) => state.updateUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      bio?: string
      website?: string
      twitter?: string
      instagram?: string
      linkedin?: string
      avatar?: File | null
    }) => {
      const { avatar, ...rest } = payload

      const formData = new FormData()
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value)
      })
      if (avatar) {
        formData.append('avatar', avatar)
      }

      const { data } = await authApi.updateProfile(formData)
      return data as User
    },
    onSuccess: (data) => {
      updateUser(data)
      queryClient.setQueryData(['profile'], data)
      // Публічний профіль (GET /users/:username/, який відкривається з
      // навбару)
      queryClient.invalidateQueries({ queryKey: ['user', data.username] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['shot'] })
      queryClient.invalidateQueries({ queryKey: ['likedShots'] })
    },
  })
}