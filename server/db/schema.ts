import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { MEAL_IDS } from '../../shared/rsvp.js'

export const attendanceEnum = pgEnum('attendance', ['yes', 'no'])
export const mealEnum = pgEnum('meal', MEAL_IDS)

export const rsvps = pgTable('rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  full_name: text('full_name').notNull(),
  // Digits only (see normalizePhone in shared/rsvp.ts), so formatting
  // differences still collide on this unique constraint
  phone: text('phone').notNull().unique(),
  attendance: attendanceEnum('attendance').notNull(),
  guest_count: integer('guest_count').notNull().default(0),
  message: text('message'),
  // Null when not attending, or for RSVPs made before meals were offered
  meal: mealEnum('meal'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
})

export const sessions = pgTable('sessions', {
  // SHA-256 of the cookie token, so a database leak doesn't expose live sessions
  id: text('id').primaryKey(),
  admin_id: uuid('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// Failed admin logins, kept briefly so repeated password guessing can be
// locked out (see server/auth.ts). Old rows are deleted as new ones arrive.
export const loginFailures = pgTable('login_failures', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  ip: text('ip').notNull(),
  attempted_at: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
})
