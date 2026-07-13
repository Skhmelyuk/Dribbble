import { mockCurrentUser } from './currentUser'

export const mockLikesByUser: Record<string, Set<number>> = {
  kyiv_creator: new Set([102]),
  lviv_designer: new Set([101, 104]),
  odesa_creative: new Set([101, 103]),
}

export const currentUserLikes = (shotId: number): boolean =>
  mockLikesByUser[mockCurrentUser.username]?.has(shotId) ?? false

export const setCurrentUserLike = (shotId: number, liked: boolean): void => {
  const set =
    mockLikesByUser[mockCurrentUser.username] ?? (mockLikesByUser[mockCurrentUser.username] = new Set())
  if (liked) set.add(shotId)
  else set.delete(shotId)
}