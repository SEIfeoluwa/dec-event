import { apiRequest, ApiError } from './api'
import type { RSVPInput } from '../schemas/rsvpSchema'
import type { NewRsvpRecord, RsvpRecord, UpdateRsvpRecord } from '../types/database'

export interface RsvpDashboardStats {
  total_responses: number
  yes_responses: number
  no_responses: number
  total_attending_guests: number
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
})

// ---------- Public ----------

export async function createRsvp(input: RSVPInput): Promise<RsvpRecord> {
  const newRsvp: NewRsvpRecord = {
    full_name: input.fullName,
    phone: input.phone,
    attendance: input.attendance,
    guest_count: input.guestCount,
    message: input.message?.trim() || null,
  }

  try {
    return await apiRequest<RsvpRecord>('/rsvps', json('POST', newRsvp))
  } catch (err) {
    // 400 (validation) and 409 (duplicate phone) carry messages meant for guests
    if (err instanceof ApiError && (err.status === 400 || err.status === 409 || err.status === 0)) {
      throw err
    }
    throw new Error('We could not submit your RSVP right now. Please try again later.', {
      cause: err,
    })
  }
}

// ---------- Admin auth ----------

export const login = (email: string, password: string) =>
  apiRequest<{ email: string }>('/auth/login', json('POST', { email, password }))

/** The signed-in admin, or null if not signed in. */
export async function getSession(): Promise<{ email: string } | null> {
  try {
    return await apiRequest<{ email: string }>('/auth/session')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export const logout = () => apiRequest<void>('/auth/logout', { method: 'POST' })

// ---------- Admin data ----------

export const listRsvps = () => apiRequest<RsvpRecord[]>('/rsvps')

export const getRsvpDashboardStats = () => apiRequest<RsvpDashboardStats>('/rsvps/stats')

export const updateRsvp = (id: string, input: UpdateRsvpRecord) =>
  apiRequest<RsvpRecord>(`/rsvps/${encodeURIComponent(id)}`, json('PATCH', input))

export const deleteRsvp = (id: string) =>
  apiRequest<void>(`/rsvps/${encodeURIComponent(id)}`, { method: 'DELETE' })
