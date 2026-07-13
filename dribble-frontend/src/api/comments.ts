import { api } from './index'
import type { Comment, PaginatedResponse } from '../types'

// Comments API GET/POST /api/shots/:id/comments/
export const commentsApi = {
  getComments: (shotId: string | number) =>
    api.get<PaginatedResponse<Comment>>(`/shots/${shotId}/comments/`),

  addComment: (shotId: string | number, text: string) =>
    api.post<Comment>(`/shots/${shotId}/comments/`, { text }),

  // Видалення власного коментаря - DELETE /shots/:id/comments/:commentId/
  deleteComment: (shotId: string | number, commentId: number) =>
    api.delete(`/shots/${shotId}/comments/${commentId}/`),
}
