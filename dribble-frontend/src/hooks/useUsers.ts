import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../api/users'
import type { PaginatedResponse, PublicProfile, Shot } from '../types'

// Профіль користувача (GET /api/users/:username/)

export const usePublicProfileQuery = (username: string | undefined) => {
  return useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await usersApi.getPublicProfile(username!)
      return response.data
    },
    enabled: !!username,
  })
}

export const useFollowMutation = (username: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => usersApi.follow(username),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<PublicProfile | undefined>(['user', username], (prev) =>
        prev ? { ...prev, is_following: data.is_following, followers_count: data.followers_count } : prev
      )
    },
  })
}

//Вподобані роботи (вкладка "Liked" у профілі)
export const useLikedShotsQuery = (username: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ['likedShots', username],
    queryFn: async ({ pageParam }) => {
      const response = await usersApi.getLikedShots(username!, { offset: pageParam, limit: 12 })
      return response.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedResponse<Shot>) => {
      if (!lastPage.next) return undefined
      try {
        const url = new URL(lastPage.next)
        const offset = url.searchParams.get('offset')
        return offset ? parseInt(offset, 10) : undefined
      } catch {
        return undefined
      }
    },
    enabled: !!username,
  })
}

//Підписники / Підписки 
export const useFollowersQuery = (username: string | undefined) => {
  return useQuery({
    queryKey: ['followers', username],
    queryFn: async () => (await usersApi.getFollowers(username!)).data,
    enabled: !!username,
  })
}

export const useFollowingQuery = (username: string | undefined) => {
  return useQuery({
    queryKey: ['following', username],
    queryFn: async () => (await usersApi.getFollowing(username!)).data,
    enabled: !!username,
  })
}
