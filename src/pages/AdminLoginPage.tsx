import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { getSession, login } from '../services/rsvps'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (await getSession()) {
          navigate('/admin/dashboard', { replace: true })
          return
        }
      } catch {
        // Server unreachable: show the form; logging in will surface the error
      }

      setCheckingSession(false)
    }

    checkSession()
  }, [navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      setLoading(true)
      await login(email, password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <main className="admin-auth">Checking session...</main>
  }

  return (
    <main className="admin-auth">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p>Please log in to access the admin panel.</p>

        {error && <div className="admin-error">Error: {error}</div>}

        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </main>
  )
}
