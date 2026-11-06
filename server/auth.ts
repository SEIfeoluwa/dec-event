import { createHash, randomBytes } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { and, eq, gt, lt } from 'drizzle-orm'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import { admins, db, sessions } from './db/index.js'

const COOKIE = 'rsvp_session'
const SESSION_DAYS = 7

// The site and API share one domain, so a first-party Lax cookie is enough.
// Secure everywhere except plain-http local development.
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  path: '/',
} as const

// A real bcrypt hash of a random throwaway password. Comparing against it when
// the email doesn't exist makes "unknown email" take as long as "wrong
// password", so response timing can't reveal which admin emails exist.
const TIMING_DUMMY_HASH = '$2b$12$UogzRucGAXcEcMjtbcdVHeVbgNcJIr9rmr7B54zRbjtbwQ9s7OBTS'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export type Admin = { id: string; email: string }

/** Returns the admin if the email and password match, otherwise null. */
export async function verifyLogin(email: string, password: string): Promise<Admin | null> {
  const [admin] = await db.select().from(admins).where(eq(admins.email, email))
  const ok = await bcrypt.compare(password, admin?.password_hash ?? TIMING_DUMMY_HASH)
  return admin && ok ? { id: admin.id, email: admin.email } : null
}

export async function createSession(c: Context, adminId: string) {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5)

  await db.insert(sessions).values({ id: hashToken(token), admin_id: adminId, expires_at: expires })
  // Housekeeping: drop expired sessions so the table doesn't grow forever
  await db.delete(sessions).where(lt(sessions.expires_at, new Date()))

  setCookie(c, COOKIE, token, { ...cookieOptions, expires })
}

export async function getAdmin(c: Context): Promise<Admin | null> {
  const token = getCookie(c, COOKIE)
  if (!token) return null

  const [row] = await db
    .select({ id: admins.id, email: admins.email })
    .from(sessions)
    .innerJoin(admins, eq(sessions.admin_id, admins.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expires_at, new Date())))

  return row ?? null
}

export async function destroySession(c: Context) {
  const token = getCookie(c, COOKIE)
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)))
  deleteCookie(c, COOKIE, cookieOptions)
}

export const requireAdmin: MiddlewareHandler<{ Variables: { admin: Admin } }> = async (c, next) => {
  const admin = await getAdmin(c)
  if (!admin) return c.json({ error: 'Not logged in' }, 401)
  c.set('admin', admin)
  await next()
}
