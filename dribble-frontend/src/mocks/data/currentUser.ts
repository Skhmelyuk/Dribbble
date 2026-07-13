export interface MockCurrentUser {
  id: number
  email: string
  username: string
  avatar: string | null
  bio: string
  website: string
  twitter: string
  instagram: string
  linkedin: string
}

export const mockCurrentUser: MockCurrentUser = {
  id: 1,
  email: 'designer@example.com',
  username: 'kyiv_creator',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  bio: 'UI/UX Designer & Illustrator from Kyiv',
  website: 'https://portfolio.com',
  twitter: 'https://twitter.com/kyiv_creator',
  instagram: 'https://instagram.com/kyiv_creator',
  linkedin: 'https://linkedin.com/in/kyiv_creator',
}