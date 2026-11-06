// Create an admin, or reset an existing admin's password:
//   npm run create-admin -- you@example.com "a-strong-password"
import 'dotenv/config'

import bcrypt from 'bcryptjs'

const [email, password] = process.argv.slice(2)

if (!email || !password || password.length < 10) {
  console.error('Usage: npm run create-admin -- <email> "<password, 10+ characters>"')
  process.exit(1)
}

const { admins, db } = await import('../server/db/index.js')

const password_hash = await bcrypt.hash(password, 12)

await db
  .insert(admins)
  .values({ email: email.trim().toLowerCase(), password_hash })
  .onConflictDoUpdate({ target: admins.email, set: { password_hash } })

console.log(`Admin ready: ${email.trim().toLowerCase()}`)
