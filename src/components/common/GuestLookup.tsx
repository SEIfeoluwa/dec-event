import { useEffect, useRef, useState } from 'react'

import { findMyTable } from '../../services/tables'
import type { TableLookupResult } from '../../services/tables'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 350

export default function GuestLookup() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TableLookupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setQuery(value)

    requestIdRef.current += 1

    if (value.trim().length < MIN_QUERY_LENGTH) {
      setLoading(false)
      setError(null)
      setResults([])
    } else {
      setLoading(true)
    }
  }

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return
    }

    const requestId = requestIdRef.current

    const timeoutId = window.setTimeout(async () => {
      try {
        const matches = await findMyTable(trimmedQuery)

        if (requestIdRef.current !== requestId) {
          return
        }

        setResults(matches)
        setError(null)
      } catch (err) {
        if (requestIdRef.current !== requestId) {
          return
        }

        setError(err instanceof Error ? err.message : 'Unable to search for your RSVP.')
        setResults([])
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  const hasSearched = query.trim().length >= MIN_QUERY_LENGTH

  return (
    <div className="guest-lookup">
      <section className="guest-lookup-section">
        <div className="guest-lookup-content">
          <p className="guest-lookup-eyebrow">
            Fayemi Celebration <span aria-hidden="true">&bull;</span> September 19, 2026
          </p>
          <h2>Find Your Seat</h2>
          <p className="guest-lookup-subtitle">
            Search your full name to find your table for the evening.
          </p>
        </div>
      </section>

      <section className="guest-lookup-search">
        <div className="guest-lookup-search-content">
          <label htmlFor="guestLookupQuery" className="guest-lookup-label">
            Your Name
          </label>

          <div className="guest-lookup-form">
            <input
              id="guestLookupQuery"
              type="text"
              placeholder="Begin typing your name..."
              value={query}
              onChange={handleQueryChange}
              aria-label="First or last name"
              autoComplete="off"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="search"
            />
          </div>

          {loading && <p className="guest-lookup-message">Searching...</p>}

          {!loading && error && <p className="guest-lookup-message">{error}</p>}

          {!loading && !error && hasSearched && (
            <div className="guest-lookup-results">
              {results.length === 0 && (
                <p className="guest-lookup-message">
                  We couldn&rsquo;t find your RSVP. Please check with the host.
                </p>
              )}

              {results.map((result, index) => (
                <div key={`${result.firstName}-${result.lastName}-${index}`} className="guest-lookup-result">
                  <p className="guest-lookup-welcome">
                    Welcome, {result.firstName}!
                  </p>

                  {result.tableName ? (
                    <p>
                      You&rsquo;re seated at <strong>Table {result.tableName}</strong>,
                      with {result.partySize} seat
                      {result.partySize === 1 ? '' : 's'} reserved for your
                      party.
                    </p>
                  ) : (
                    <p>Your table assignment is coming soon.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
