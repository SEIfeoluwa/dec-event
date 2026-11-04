export type AttendanceStatus = 'yes' | 'no'

export type RsvpRecord = {
  id: string
  first_name: string
  last_name: string
  phone: string
  attendance: AttendanceStatus
  guest_count: number
  message: string | null
}

export type NewRsvpRecord = Omit<RsvpRecord, 'id'>

export type UpdateRsvpRecord = Omit<RsvpRecord, 'id'>
