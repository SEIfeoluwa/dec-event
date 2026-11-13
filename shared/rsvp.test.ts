import { describe, expect, it } from 'vitest'

import { loginSchema, MESSAGES, normalizePhone, RSVP_LIMITS, rsvpRecordSchema } from './rsvp.js'

const validRecord = {
  full_name: 'Ada Lovelace',
  phone: '(301) 555-1234',
  attendance: 'yes',
  guest_count: 2,
  message: null,
  meal: 'ofada',
}

// The API returns the first issue, so tests check that message.
const firstError = (overrides: Record<string, unknown>) => {
  const result = rsvpRecordSchema.safeParse({ ...validRecord, ...overrides })
  return result.success ? null : result.error.issues[0]?.message
}

describe('normalizePhone', () => {
  it.each([
    ['(301) 555-1234', '3015551234'],
    ['301.555.1234', '3015551234'],
    ['+1 301 555 1234', '3015551234'],
    ['13015551234', '3015551234'],
  ])('turns %j into %j', (input, digits) => {
    expect(normalizePhone(input)).toBe(digits)
  })

  it.each(['', '555-1234', '23015551234', '301555123456'])('rejects %j', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})

describe('rsvpRecordSchema (API)', () => {
  it('normalizes a valid RSVP for storage', () => {
    const result = rsvpRecordSchema.parse({
      ...validRecord,
      full_name: '  Ada   Lovelace ',
      phone: '+1 (301) 555-1234',
      guest_count: '3',
    })

    expect(result).toEqual({
      full_name: 'Ada Lovelace',
      phone: '3015551234',
      attendance: 'yes',
      guest_count: 3,
      message: null,
      meal: 'ofada',
    })
  })

  // Stored phones are digits only, so these collide on the unique constraint
  it('stores differently formatted copies of a number identically', () => {
    const phones = ['(301) 555-1234', '301-555-1234', '1 301 555 1234'].map(
      (phone) => rsvpRecordSchema.parse({ ...validRecord, phone }).phone,
    )

    expect(new Set(phones)).toEqual(new Set(['3015551234']))
  })

  it('sets 0 guests and no meal when not attending', () => {
    const result = rsvpRecordSchema.parse({ ...validRecord, attendance: 'no', guest_count: 5 })

    expect(result.guest_count).toBe(0)
    expect(result.meal).toBeNull()
  })

  it('rejects an invalid phone', () => {
    expect(firstError({ phone: '555-1234' })).toBe(MESSAGES.phone)
  })

  it.each(['', '   '])('rejects a blank name (%j)', (full_name) => {
    expect(firstError({ full_name })).toBe(MESSAGES.name)
  })

  it('rejects a name over the limit', () => {
    expect(firstError({ full_name: 'a'.repeat(RSVP_LIMITS.nameMax + 1) })).toBe(MESSAGES.nameTooLong)
  })

  it('requires attendance to be yes or no', () => {
    expect(firstError({ attendance: 'maybe' })).toBe(MESSAGES.attendance)
  })

  describe('guest count', () => {
    it('requires at least 1 guest when attending', () => {
      const result = rsvpRecordSchema.safeParse({ ...validRecord, guest_count: 0 })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]).toMatchObject({ message: MESSAGES.guests, path: ['guest_count'] })
    })

    it.each([1.5, -1, 'abc'])('rejects %j', (guest_count) => {
      expect(firstError({ guest_count })).toBe(MESSAGES.guests)
    })

    it('rejects more than the maximum', () => {
      expect(firstError({ guest_count: RSVP_LIMITS.guestsMax + 1 })).toBe(MESSAGES.guestsTooMany)
    })
  })

  describe('message', () => {
    it.each([undefined, null, '', '   '])('stores %j as null', (message) => {
      expect(rsvpRecordSchema.parse({ ...validRecord, message }).message).toBeNull()
    })

    it('trims and keeps a real message', () => {
      expect(rsvpRecordSchema.parse({ ...validRecord, message: '  Congratulations! ' }).message).toBe(
        'Congratulations!',
      )
    })

    it('rejects a message over the limit', () => {
      expect(firstError({ message: 'a'.repeat(RSVP_LIMITS.messageMax + 1) })).toBe(MESSAGES.messageTooLong)
    })
  })

  describe('meal', () => {
    // RSVPs made before meals were offered have none and must stay valid
    it('is optional when attending', () => {
      expect(rsvpRecordSchema.parse({ ...validRecord, meal: undefined }).meal).toBeNull()
    })

    it("rejects a meal that isn't on the menu", () => {
      expect(firstError({ meal: 'pizza' })).toBe(MESSAGES.meal)
    })
  })
})

describe('loginSchema', () => {
  it('trims and lowercases the email', () => {
    expect(loginSchema.parse({ email: '  Admin@Example.COM ', password: 'secret' }).email).toBe(
      'admin@example.com',
    )
  })

  it.each([
    { email: 'not-an-email', password: 'secret' },
    { email: 'admin@example.com', password: '' },
  ])('rejects %j', (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false)
  })
})
