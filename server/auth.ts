import { createHash, randomBytes } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { and, eq, gt, lt, or, sql } from 'drizzle-orm'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import { admins, db, loginFailures, sessions } from './db/index.js'

const COOKIE = 'rsvp_session'
const SESSION_DAYS = 7

// Brute-force protection: too many failed logins within the window locks
// further attempts. The per-IP limit is higher so a shared network (e.g. the
// venue's wifi) isn't locked out by one person's typos.
export const LOGIN_LOCK_MINUTES = 15
const MAX_FAILURES_PER_EMAIL = 5
const MAX_FAILURES_PER_IP = 20

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

// Vercel sets these headers itself, so visitors can't spoof them in production
export const clientIp = (c: Context) =>
  c.req.header('x-real-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

const lockWindowStart = () => new Date(Date.now() - LOGIN_LOCK_MINUTES * 6e4)

/** True if this email or IP has failed too many logins recently. */
export async function isLoginLocked(email: string, ip: string): Promise<boolean> {
  const [failures] = await db
    .select({
      byEmail: sql<number>`count(*) filter (where ${loginFailures.email} = ${email})::int`,
      byIp: sql<number>`count(*) filter (where ${loginFailures.ip} = ${ip})::int`,
    })
    .from(loginFailures)
    .where(
      and(
        gt(loginFailures.attempted_at, lockWindowStart()),
        or(eq(loginFailures.email, email), eq(loginFailures.ip, ip)),
      ),
    )
  return failures.byEmail >= MAX_FAILURES_PER_EMAIL || failures.byIp >= MAX_FAILURES_PER_IP
}

export async function recordLoginFailure(email: string, ip: string) {
  await db.insert(loginFailures).values({ email, ip })
  // Housekeeping: failures older than the window no longer count
  await db.delete(loginFailures).where(lt(loginFailures.attempted_at, lockWindowStart()))
}

export async function clearLoginFailures(email: string) {
  await db.delete(loginFailures).where(eq(loginFailures.email, email))
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
