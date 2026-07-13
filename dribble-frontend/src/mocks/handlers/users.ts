import { http, HttpResponse } from 'msw'
import type { FollowUser, PublicProfile } from '../../types'
import { mockCurrentUser } from '../data/currentUser'
import { findUserByUsername } from '../data/users'
import { mockShots, serializeShot } from './shots'
import {
  currentUserFollows,
  toggleCurrentUserFollow,
  getFollowerUsernames,
  getFollowingUsernames,
} from '../data/follows'
import { mockLikesByUser } from '../data/likes'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const usernamesToFollowUsers = (usernames: string[]): FollowUser[] =>
  usernames
    .map((username) => findUserByUsername(username))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio }))

export const usersHandlers = [
  // GET /users/:username/ — публічний профіль
  http.get(`${BASE_URL}/users/:username/`, ({ params }) => {
    const username = params.username as string
    const user = findUserByUsername(username)
    if (!user) {
      return HttpResponse.json({ detail: 'Користувача не знайдено.' }, { status: 404 })
    }

    const profile: PublicProfile = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      twitter: user.twitter,
      instagram: user.instagram,
      linkedin: user.linkedin,
      shots_count: mockShots.filter((s) => s.author.username === username).length,
      followers_count: getFollowerUsernames(username).length,
      following_count: getFollowingUsernames(username).length,
      is_following: currentUserFollows(username),
    }

    return HttpResponse.json(profile, { status: 200 })
  }),

  // POST /users/:username/follow/ — toggle підписки
  http.post(`${BASE_URL}/users/:username/follow/`, ({ params, request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Облікові дані не надано.' }, { status: 401 })
    }

    const username = params.username as string
    if (!findUserByUsername(username)) {
      return HttpResponse.json({ detail: 'Користувача не знайдено.' }, { status: 404 })
    }
    if (username === mockCurrentUser.username) {
      return HttpResponse.json({ detail: 'Неможливо підписатися на самого себе.' }, { status: 400 })
    }

    const isFollowing = toggleCurrentUserFollow(username)
    return HttpResponse.json(
      { is_following: isFollowing, followers_count: getFollowerUsernames(username).length },
      { status: 200 }
    )
  }),

  // GET /users/:username/liked/ — вподобані роботи
  http.get(`${BASE_URL}/users/:username/liked/`, ({ params, request }) => {
    const username = params.username as string
    if (!findUserByUsername(username)) {
      return HttpResponse.json({ detail: 'Користувача не знайдено.' }, { status: 404 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '12', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    const likedIds = mockLikesByUser[username] ?? new Set<number>()
    const liked = mockShots.filter((s) => likedIds.has(s.id)).map(serializeShot)

    const sliced = liked.slice(offset, offset + limit)
    const nextOffset = offset + limit
    const nextUrl =
      nextOffset < liked.length
        ? `${BASE_URL}/users/${username}/liked/?limit=${limit}&offset=${nextOffset}`
        : null

    return HttpResponse.json(
      { count: liked.length, next: nextUrl, previous: null, results: sliced },
      { status: 200 }
    )
  }),

  // GET /users/:username/followers/
  http.get(`${BASE_URL}/users/:username/followers/`, ({ params }) => {
    const username = params.username as string
    if (!findUserByUsername(username)) {
      return HttpResponse.json({ detail: 'Користувача не знайдено.' }, { status: 404 })
    }
    return HttpResponse.json(usernamesToFollowUsers(getFollowerUsernames(username)), { status: 200 })
  }),

  // GET /users/:username/following/
  http.get(`${BASE_URL}/users/:username/following/`, ({ params }) => {
    const username = params.username as string
    if (!findUserByUsername(username)) {
      return HttpResponse.json({ detail: 'Користувача не знайдено.' }, { status: 404 })
    }
    return HttpResponse.json(usernamesToFollowUsers(getFollowingUsernames(username)), { status: 200 })
  }),
]
