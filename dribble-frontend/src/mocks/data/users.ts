import type { ShotAuthor } from '../../types'
import { mockCurrentUser } from './currentUser'

export interface MockUserIdentity {
  id: number
  username: string
  avatar: string | null
  bio: string
  website: string
  twitter: string
  instagram: string
  linkedin: string
}

export const MOCK_OTHER_USERS: MockUserIdentity[] = [
  {
    id: 2,
    username: 'lviv_designer',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Creative Director & Brand Designer',
    website: 'https://lvivdesigner.com',
    twitter: 'https://twitter.com/lviv_designer',
    instagram: 'https://instagram.com/lviv_designer',
    linkedin: '',
  },
  {
    id: 3,
    username: 'odesa_creative',
    avatar: null,
    bio: 'Landing page & branding specialist from Odesa',
    website: '',
    twitter: '',
    instagram: 'https://instagram.com/odesa_creative',
    linkedin: 'https://linkedin.com/in/odesa_creative',
  },
]

export const getUsersDirectory = (): MockUserIdentity[] => [{ ...mockCurrentUser }, ...MOCK_OTHER_USERS]

export const findUserByUsername = (username: string): MockUserIdentity | undefined =>
  getUsersDirectory().find((u) => u.username === username)

export const findUserById = (id: number): MockUserIdentity | undefined =>
  getUsersDirectory().find((u) => u.id === id)

export const toShotAuthor = (u: MockUserIdentity): ShotAuthor => ({
  id: u.id,
  username: u.username,
  avatar: u.avatar,
})