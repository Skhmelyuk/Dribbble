import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from '../api/comments'

export const useCommentsQuery = (shotId: string | number) => {
  return useQuery({
    queryKey: ['comments', shotId],
    queryFn: async () => {
      const response = await commentsApi.getComments(shotId)
      return response.data
    },
    enabled: !!shotId,
  })
}

export const useAddCommentMutation = (shotId: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (text: string) => commentsApi.addComment(shotId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', shotId] })
      queryClient.invalidateQueries({ queryKey: ['shot', shotId] })
    },
  })
}

// Видалення власного коментаря
export const useDeleteCommentMutation = (shotId: string | number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: number) => commentsApi.deleteComment(shotId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', shotId] })
      queryClient.invalidateQueries({ queryKey: ['shot', shotId] })
    },
  })
}
