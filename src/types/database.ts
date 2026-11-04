export type AttendanceStatus = 'yes' | 'no'

export type RsvpRecord = {
  id: string
  first_name: string
  last_name: string
  phone: string
  sms_consent: boolean
  attendance: AttendanceStatus
  guest_count: number
  male_guest_count: number
  female_guest_count: number
  child_guest_count: number
  message: string | null
  table_id: string | null
}

export type NewRsvpRecord = Omit<RsvpRecord, 'id' | 'guest_count'>

export type UpdateRsvpRecord = Omit<RsvpRecord, 'id' | 'guest_count'>

export type TableRecord = {
  id: string
  name: string
  max_capacity: number
  created_at: string
}

export type NewTableRecord = Omit<TableRecord, 'id' | 'created_at'>

export type UpdateTableRecord = Partial<NewTableRecord>

export type TablePlanRow = {
  table_id: string
  table_name: string
  max_capacity: number
  seats_assigned: number
}