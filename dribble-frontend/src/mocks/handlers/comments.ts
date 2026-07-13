import { http, HttpResponse } from 'msw'
import type { Comment } from '../../types'
import { mockCurrentUser } from '../data/currentUser'
import { MOCK_OTHER_USERS, toShotAuthor } from '../data/users'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const lvivDesigner = MOCK_OTHER_USERS.find((u) => u.username === 'lviv_designer')!

// In-memory коментарі
const mockComments: Record<string, Comment[]> = {
  '103': [
    {
      id: 1,
      text: 'Дуже круте рішення, особливо кольорова палітра!',
      author: toShotAuthor(lvivDesigner),
      created_at: '2026-06-08T11:00:00Z',
    },
  ],
}

let nextCommentId = 1000

export const commentsHandlers = [
  // GET /shots/:id/comments/
  http.get(`${BASE_URL}/shots/:id/comments/`, ({ params }) => {
    const id = params.id as string
    const results = mockComments[id] || []
    return HttpResponse.json(
      { count: results.length, next: null, previous: null, results },
      { status: 200 }
    )
  }),

  // POST /shots/:id/comments/
  http.post(`${BASE_URL}/shots/:id/comments/`, async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Облікові дані не надано.' }, { status: 401 })
    }

    const id = params.id as string
    const body = (await request.json()) as { text?: string }

    if (!body.text?.trim()) {
      return HttpResponse.json({ text: ['Текст коментаря обовʼязковий.'] }, { status: 400 })
    }

    const newComment: Comment = {
      id: nextCommentId++,
      text: body.text.trim(),
      author: toShotAuthor(mockCurrentUser),
      created_at: new Date().toISOString(),
    }

    if (!mockComments[id]) mockComments[id] = []
    mockComments[id].push(newComment)

    return HttpResponse.json(newComment, { status: 201 })
  }),

  // DELETE /shots/:id/comments/:commentId/ — видалення власного коментаря
  http.delete(`${BASE_URL}/shots/:id/comments/:commentId/`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Облікові дані не надано.' }, { status: 401 })
    }

    const id = params.id as string
    const commentId = parseInt(params.commentId as string, 10)
    const list = mockComments[id] || []
    const index = list.findIndex((c) => c.id === commentId)

    if (index === -1) {
      return HttpResponse.json({ detail: 'Коментар не знайдено.' }, { status: 404 })
    }

    // Дозволяємо видаляти лише власні коментарі.
    if (list[index].author.id !== mockCurrentUser.id) {
      return HttpResponse.json({ detail: 'Можна видаляти лише власні коментарі.' }, { status: 403 })
    }

    list.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
