// Local development: runs the API on http://localhost:3000.
// `npm run dev` starts this alongside Vite, which proxies /api here.
import 'dotenv/config'

import { serve } from '@hono/node-server'

// Imported after dotenv so DATABASE_URL is set before the DB module loads
const { default: app } = await import('./app.js')

const port = Number(process.env.API_PORT ?? 3000)
serve({ fetch: app.fetch, port }, () => console.log(`API running on http://localhost:${port}/api`))
