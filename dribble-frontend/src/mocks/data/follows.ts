import { mockCurrentUser } from './currentUser'

export const mockFollowGraph: Record<string, Set<string>> = {
  kyiv_creator: new Set(['lviv_designer']),
  lviv_designer: new Set(['kyiv_creator', 'odesa_creative']),
  odesa_creative: new Set(['kyiv_creator', 'lviv_designer']),
}

export const getFollowingUsernames = (username: string): string[] =>
  Array.from(mockFollowGraph[username] ?? [])

export const getFollowerUsernames = (username: string): string[] =>
  Object.entries(mockFollowGraph)
    .filter(([, following]) => following.has(username))
    .map(([follower]) => follower)

// Чи поточний (залогінений у моку) користувач підписаний на :username
export const currentUserFollows = (username: string): boolean =>
  mockFollowGraph[mockCurrentUser.username]?.has(username) ?? false

// Toggle-підписка поточного користувача на :username. Повертає новий стан.
export const toggleCurrentUserFollow = (username: string): boolean => {
  const set = mockFollowGraph[mockCurrentUser.username] ?? (mockFollowGraph[mockCurrentUser.username] = new Set())
  if (set.has(username)) {
    set.delete(username)
    return false
  }
  set.add(username)
  return true
}