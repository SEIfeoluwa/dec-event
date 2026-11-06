// Vercel Function entry point. vercel.json rewrites every /api/* request here,
// and the Hono app (basePath "/api") routes it.
import { handle } from 'hono/vercel'

import app from '../server/app.js'

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
