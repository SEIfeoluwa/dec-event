// Thin fetch wrapper for the RSVP API (server/app.ts), served from /api on
// the same domain as the site, so the admin session cookie is first-party.
const BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response

  try {
    res = await fetch(BASE + path, {
      ...init,
      credentials: 'include', // send the admin session cookie
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? 'Something went wrong. Please try again.', body.field)
  }

  return body as T
}
