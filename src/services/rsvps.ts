import { supabase } from './supabase'
import type { RSVPInput } from '../schemas/rsvpSchema'
import type { NewRsvpRecord, RsvpRecord, UpdateRsvpRecord } from '../types/database'

export interface RsvpDashboardStats {
  total_responses: number
  yes_responses: number
  no_responses: number
  total_attending_guests: number
  total_men: number
  total_women: number
  total_children: number
}

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Missing Supabase environment variables.')
  }

  return supabase
}

function getRsvpSubmissionErrorMessage(error: { code?: string; message: string }) {
  if (error.code === '23505') {
    return 'An RSVP has already been submitted with this phone number.'
  }

  if (
    error.code === '42501' ||
    error.message.toLowerCase().includes('row-level security')
  ) {
    return 'We could not submit your RSVP right now. Please try again later.'
  }

  return 'We could not submit your RSVP right now. Please try again later.'
}

export async function createRsvp(input: RSVPInput): Promise<RsvpRecord> {
  const client = getSupabaseClient()

  const newRsvp: NewRsvpRecord = {
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    sms_consent: input.smsConsent,
    attendance: input.attendance,
    male_guest_count: input.maleGuestCount,
    female_guest_count: input.femaleGuestCount,
    child_guest_count: input.childGuestCount,
    message: input.message?.trim() || null,
    table_id: null,
  }

  const { data, error } = await client
    .from('rsvps')
    .insert(newRsvp)
    .select()
    .single()

  if (error) {
    throw new Error(getRsvpSubmissionErrorMessage(error))
  }

  return data as RsvpRecord
}

export async function updateRsvp(
  id: string,
  input: UpdateRsvpRecord,
): Promise<RsvpRecord> {
  const client = getSupabaseClient()

  const updatedRsvp: UpdateRsvpRecord = {
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    phone: input.phone.trim(),
    sms_consent: input.sms_consent,
    attendance: input.attendance,
    male_guest_count: input.male_guest_count,
    female_guest_count: input.female_guest_count,
    child_guest_count: input.child_guest_count,
    message: input.message?.trim() || null,
    table_id: input.table_id,
  }

  const { data, error } = await client
    .from('rsvps')
    .update(updatedRsvp)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as RsvpRecord
}

export async function deleteRsvp(id: string): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client.from('rsvps').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function getRsvpDashboardStats(): Promise<RsvpDashboardStats> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('get_rsvp_dashboard_stats')

  if (error) {
    throw new Error(error.message)
  }

  const stats = data?.[0]

  if (!stats) {
    throw new Error('No RSVP statistics were returned.')
  }

  return stats as RsvpDashboardStats
}