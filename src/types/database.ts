export type AttendanceStatus = 'yes' | 'no'

/** An RSVP as returned by the API (see server/db/schema.ts). */
export type RsvpRecord = {
  id: string
  full_name: string
  phone: string
  attendance: AttendanceStatus
  guest_count: number
  message: string | null
  created_at: string
}

/** What the API accepts to create or update an RSVP. */
export type NewRsvpRecord = Omit<RsvpRecord, 'id' | 'created_at'>

export type UpdateRsvpRecord = NewRsvpRecord
