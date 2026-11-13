import { asc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { ZodError } from 'zod'

import { loginSchema, rsvpRecordSchema } from '../shared/rsvp.js'
import type { MealChoice } from '../shared/rsvp.js'
import {
  clearLoginFailures,
  clientIp,
  createSession,
  destroySession,
  getAdmin,
  isLoginLocked,
  LOGIN_LOCK_MINUTES,
  recordLoginFailure,
  requireAdmin,
  verifyLogin,
} from './auth.js'
import { db, rsvps } from './db/index.js'

// Served from the same domain as the site under /api, so no CORS is needed
const app = new Hono().basePath('/api')

type PgError = { code?: string; cause?: { code?: string } }
const pgCode = (e: unknown) => (e as PgError)?.code ?? (e as PgError)?.cause?.code

const DUPLICATE_PHONE = { error: 'An RSVP has already been submitted with this phone number.' }

const firstIssue = (err: ZodError) => ({
  error: err.issues[0]?.message ?? 'Invalid input',
  field: err.issues[0]?.path[0],
})

const readJson = (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => null)
const NOT_JSON = { error: 'Request body must be JSON.' }

// ---------- Public ----------

// Create RSVP (guest form and the admin "Add RSVP" pop-up)
app.post('/rsvps', async (c) => {
  const body = await readJson(c)
  if (body === null) return c.json(NOT_JSON, 400)
  const parsed = rsvpRecordSchema.safeParse(body)
  if (!parsed.success) return c.json(firstIssue(parsed.error), 400)

  try {
    const [row] = await db.insert(rsvps).values(parsed.data).returning()
    return c.json(row, 201)
  } catch (e) {
    if (pgCode(e) === '23505') return c.json(DUPLICATE_PHONE, 409)
    throw e
  }
})

// ---------- Auth ----------

app.post('/auth/login', async (c) => {
  const parsed = loginSchema.safeParse(await readJson(c))
  if (!parsed.success) return c.json({ error: 'Enter your email and password.' }, 400)

  const { email, password } = parsed.data
  const ip = clientIp(c)

  // Checked before the password, so a locked-out guesser learns nothing
  if (await isLoginLocked(email, ip)) {
    c.header('Retry-After', String(LOGIN_LOCK_MINUTES * 60))
    return c.json(
      { error: `Too many failed login attempts. Please wait ${LOGIN_LOCK_MINUTES} minutes and try again.` },
      429,
    )
  }

  const admin = await verifyLogin(email, password)
  if (!admin) {
    await recordLoginFailure(email, ip)
    return c.json({ error: 'Incorrect email or password.' }, 401)
  }

  await clearLoginFailures(email)
  await createSession(c, admin.id)
  return c.json({ email: admin.email })
})

app.get('/auth/session', async (c) => {
  const admin = await getAdmin(c)
  return admin ? c.json({ email: admin.email }) : c.json({ error: 'Not logged in' }, 401)
})

app.post('/auth/logout', async (c) => {
  await destroySession(c)
  return c.body(null, 204)
})

// ---------- Admin ----------

const mealGuests = (meal: MealChoice) =>
  sql<number>`coalesce(sum(${rsvps.guest_count}) filter (where ${rsvps.attendance} = 'yes' and ${rsvps.meal} = ${meal}), 0)::int`

// Registered before /rsvps/:id so "stats" isn't treated as an id
app.get('/rsvps/stats', requireAdmin, async (c) => {
  const [stats] = await db
    .select({
      total_responses: sql<number>`count(*)::int`,
      yes_responses: sql<number>`count(*) filter (where ${rsvps.attendance} = 'yes')::int`,
      no_responses: sql<number>`count(*) filter (where ${rsvps.attendance} = 'no')::int`,
      total_attending_guests: sql<number>`coalesce(sum(${rsvps.guest_count}) filter (where ${rsvps.attendance} = 'yes'), 0)::int`,
      // Guests per meal (each RSVP picks one meal for its whole party)
      ofada_guests: mealGuests('ofada'),
      amala_guests: mealGuests('amala'),
      jollof_guests: mealGuests('jollof'),
      no_meal_guests: sql<number>`coalesce(sum(${rsvps.guest_count}) filter (where ${rsvps.attendance} = 'yes' and ${rsvps.meal} is null), 0)::int`,
    })
    .from(rsvps)
  return c.json(stats)
})

app.get('/rsvps', requireAdmin, async (c) => {
  const rows = await db.select().from(rsvps).orderBy(asc(rsvps.full_name))
  return c.json(rows)
})

app.patch('/rsvps/:id', requireAdmin, async (c) => {
  const body = await readJson(c)
  if (body === null) return c.json(NOT_JSON, 400)
  const parsed = rsvpRecordSchema.safeParse(body)
  if (!parsed.success) return c.json(firstIssue(parsed.error), 400)

  try {
    const [row] = await db
      .update(rsvps)
      .set(parsed.data)
      .where(eq(rsvps.id, c.req.param('id')))
      .returning()
    return row ? c.json(row) : c.json({ error: 'RSVP not found' }, 404)
  } catch (e) {
    if (pgCode(e) === '23505') return c.json(DUPLICATE_PHONE, 409)
    throw e
  }
})

app.delete('/rsvps/:id', requireAdmin, async (c) => {
  await db.delete(rsvps).where(eq(rsvps.id, c.req.param('id')))
  return c.body(null, 204)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((err, c) => {
  // A malformed UUID in :id comes back from Postgres as 22P02
  if (pgCode(err) === '22P02') return c.json({ error: 'RSVP not found' }, 404)
  // Log without query parameters: they contain guests' names and phone numbers
  const cause = (err as { cause?: { message?: string } }).cause
  console.error(`${c.req.method} ${c.req.path} failed:`, pgCode(err) ?? '', cause?.message ?? err.message.split('\n')[0])
  return c.json({ error: 'Something went wrong' }, 500)
})

export default app
