// RSVP rules shared by the browser (src/) and the API (server/), so the form
// and the backend can never disagree about what a valid RSVP is.
import { z } from 'zod'

export const RSVP_LIMITS = {
  nameMax: 120,
  messageMax: 500,
  guestsMax: 20,
} as const

/**
 * Digits only, US numbers: "(301) 555-1234", "301.555.1234" and
 * "+1 301 555 1234" all become "3015551234". Returns null if it isn't a
 * 10-digit number. Stored this way so formatting can't dodge the
 * one-RSVP-per-phone rule.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  return null
}

export const MESSAGES = {
  name: 'Enter your full name.',
  nameTooLong: `Name cannot exceed ${RSVP_LIMITS.nameMax} characters.`,
  phone: 'Enter a valid 10-digit phone number.',
  attendance: 'Select your attendance.',
  guests: 'Guest count must be a whole number of at least 1.',
  guestsTooMany: `Guest count cannot exceed ${RSVP_LIMITS.guestsMax}. Please contact the family for larger parties.`,
  messageTooLong: `Message cannot exceed ${RSVP_LIMITS.messageMax} characters.`,
} as const

/** API payload for creating or updating an RSVP (the full record minus id). */
export const rsvpRecordSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, MESSAGES.name)
      .max(RSVP_LIMITS.nameMax, MESSAGES.nameTooLong)
      .transform((name) => name.replace(/\s+/g, ' ')),
    phone: z.string().transform((value, ctx) => {
      const phone = normalizePhone(value)
      if (!phone) {
        ctx.addIssue({ code: 'custom', message: MESSAGES.phone })
        return z.NEVER
      }
      return phone
    }),
    attendance: z.enum(['yes', 'no'], { error: MESSAGES.attendance }),
    guest_count: z.coerce
      .number({ error: MESSAGES.guests })
      .int(MESSAGES.guests)
      .min(0, MESSAGES.guests)
      .max(RSVP_LIMITS.guestsMax, MESSAGES.guestsTooMany),
    message: z
      .string()
      .trim()
      .max(RSVP_LIMITS.messageMax, MESSAGES.messageTooLong)
      .nullish()
      .transform((message) => message || null),
  })
  // "Not attending" always means 0 guests
  .transform((rsvp) => ({
    ...rsvp,
    guest_count: rsvp.attendance === 'no' ? 0 : rsvp.guest_count,
  }))
  .refine((rsvp) => rsvp.attendance === 'no' || rsvp.guest_count >= 1, {
    message: MESSAGES.guests,
    path: ['guest_count'],
  })

export type RsvpRecordInput = z.input<typeof rsvpRecordSchema>
export type RsvpRecordData = z.output<typeof rsvpRecordSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
})
