import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema.js'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
}

// Neon's HTTP driver needs no connection pool, which suits serverless functions
export const db = drizzle(neon(process.env.DATABASE_URL), { schema })
export * from './schema.js'
