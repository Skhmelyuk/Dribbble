import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { shotsApi, type GetShotsParams } from '../api/shots'
import type { PaginatedResponse, Shot } from '../types'

//useFeedQuery 
export const useFeedQuery = (
  filters: Omit<GetShotsParams, 'limit' | 'offset'>,
  options?: { enabled?: boolean }
) => {
  return useInfiniteQuery({
    queryKey: ['feed', filters],
    queryFn: async ({ pageParam }) => {
      const response = await shotsApi.getShots({
        offset: pageParam,
        limit: 12,
        ...filters,
      })
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
    enabled: options?.enabled ?? true,
  })
}

//useShotQuery
export const useShotQuery = (id: string | number) => {
  return useQuery({
    queryKey: ['shot', id],
    queryFn: async () => {
      const response = await shotsApi.getShot(id)
      return response.data
    },
    enabled: !!id,
  })
}

//useCreateShotMutation
export const useCreateShotMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: shotsApi.createShot,
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      navigate(`/shot/${data.id}`)
    },
  })
}

//useDeleteShotMutation
export const useDeleteShotMutation = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (id: string | number) => shotsApi.deleteShot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      navigate('/feed')
    },
  })
}

// useLikeShotMutation / useSaveShotMutation 
export const useLikeShotMutation = (id: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => shotsApi.likeShot(id),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<Shot | undefined>(['shot', id], (prev) =>
        prev ? { ...prev, is_liked: data.is_liked, likes_count: data.likes_count } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['likedShots'] })
    },
  })
}

export const useSaveShotMutation = (id: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => shotsApi.saveShot(id),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<Shot | undefined>(['shot', id], (prev) =>
        prev ? { ...prev, is_saved: data.is_saved } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
