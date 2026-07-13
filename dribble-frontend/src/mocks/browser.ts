import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { shotsHandlers } from './handlers/shots'
import { commentsHandlers } from './handlers/comments'
import { usersHandlers } from './handlers/users'
import { searchHandlers } from './handlers/search'

export const worker = setupWorker(
  ...authHandlers,
  ...shotsHandlers,
  ...commentsHandlers,
  ...usersHandlers,
  ...searchHandlers
)
