import { api } from './index'
import type { SearchResponse } from '../types'

export interface SearchParams {
  q: string
  type?: 'shots' | 'users'
  limit?: number
  offset?: number
}

// Search API: GET /api/search/?q=
export const searchApi = {
  search: (params: SearchParams) => api.get<SearchResponse>('/search/', { params }),
}
