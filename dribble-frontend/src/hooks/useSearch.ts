import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api/search'

export const useSearchQuery = (q: string) => {
  return useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const response = await searchApi.search({ q, limit: 20 })
      return response.data
    },
    enabled: q.trim().length > 0,
  })
}
