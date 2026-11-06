import { useLayoutEffect, useRef, useState } from 'react'

import { RSVP_LIMITS } from '../../../shared/rsvp'
import { createRsvp } from '../../services/rsvps'
import { rsvpSchema } from '../../schemas/rsvpSchema'
import type { RSVPInput } from '../../schemas/rsvpSchema'

const RSVP_CLOSED = false

interface RsvpProps {
  onRsvpClick?: () => void
}

type FormData = Omit<RSVPInput, 'attendance' | 'guestCount'> & {
  attendance: RSVPInput['attendance'] | ''
  guestCount: string
}

const initialFormData: FormData = {
  fullName: '',
  phone: '',
  attendance: '',
  guestCount: '1',
  message: '',
}

interface FormState {
  submitting: boolean
  error: string | null
  success: string | null
}

export default function Rsvp({ onRsvpClick }: RsvpProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [formState, setFormState] = useState<FormState>({
    submitting: false,
    error: null,
    success: null,
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const setAttendance = (attendance: RSVPInput['attendance']) => {
    setFormData((prev) => ({ ...prev, attendance }))
  }

  const changeGuestCount = (delta: number) => {
    setFormData((prev) => {
      const current = Number.parseInt(prev.guestCount, 10)
      const next = Math.min(
        RSVP_LIMITS.guestsMax,
        Math.max(1, (Number.isNaN(current) ? 1 : current) + delta),
      )
      return { ...prev, guestCount: String(next) }
    })
  }

  const guestCountValue = Number.parseInt(formData.guestCount, 10)

  // Grow the message box to fit its text (starting at 3 rows), and shrink it
  // back when the text is removed or the form resets after submitting.
  const messageRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const textarea = messageRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const borders = textarea.offsetHeight - textarea.clientHeight
    textarea.style.height = `${textarea.scrollHeight + borders}px`
  }, [formData.message])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState({ submitting: true, error: null, success: null })

    const parsed = rsvpSchema.safeParse(formData)

    if (!parsed.success) {
      setFormState({
        submitting: false,
        error: parsed.error.issues[0]?.message ?? 'Please check your RSVP details.',
        success: null,
      })
      return
    }

    try {
      await createRsvp(parsed.data)
      setFormData(initialFormData)
      setFormState({
        submitting: false,
        error: null,
        success: 'Thank you. Your RSVP has been submitted.',
      })
      onRsvpClick?.()
    } catch (err) {
      setFormState({
        submitting: false,
        error: err instanceof Error ? err.message : 'Unable to submit your RSVP.',
        success: null,
      })
    }
  }

  if (RSVP_CLOSED) {
    return (
      <section className="rsvp-form" id="rsvp-form-section">
        <h2>RSVPs Have Closed</h2>
        <p>
          Thank you to everyone who responded. We are no longer accepting
          new RSVPs or changes. We can&rsquo;t wait to celebrate with you!
        </p>
      </section>
    )
  }

  return (
    <section className="rsvp-form" id="rsvp-form-section">
      <h2>Will you be attending?</h2>
      <p>Please respond by August 19</p>

      <form onSubmit={handleSubmit} className="rsvp-form-container">
        <div className="form-row rsvp-contact-row">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              autoCapitalize="words"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(123) 456-7890"
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <span className="form-label" id="attendance-label">
              Will you attend? *
            </span>
            <div
              className="choice-group"
              role="radiogroup"
              aria-labelledby="attendance-label"
            >
              <button
                type="button"
                role="radio"
                aria-checked={formData.attendance === 'yes'}
                className="choice-btn"
                onClick={() => setAttendance('yes')}
              >
                Yes, I&rsquo;ll be there
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={formData.attendance === 'no'}
                className="choice-btn"
                onClick={() => setAttendance('no')}
              >
                Sorry, can&rsquo;t make it
              </button>
            </div>
          </div>
        </div>

        {formData.attendance === 'yes' && (
          <div className="form-row">
            <div className="form-group full-width guest-count-group">
              <label htmlFor="guestCount">Number of Guests *</label>
              <div className="stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => changeGuestCount(-1)}
                  disabled={!(guestCountValue > 1)}
                  aria-label="Remove a guest"
                >
                  &minus;
                </button>
                <input
                  type="text"
                  id="guestCount"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => changeGuestCount(1)}
                  disabled={guestCountValue >= RSVP_LIMITS.guestsMax}
                  aria-label="Add a guest"
                >
                  +
                </button>
              </div>
              <p className="form-helper">
                Please include yourself and everyone attending with you.
              </p>
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              ref={messageRef}
              className="auto-grow"
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Any special message for the celebrant?"
              rows={3}
            />
          </div>
        </div>

        {formState.error && <p className="form-status form-status-error">{formState.error}</p>}
        {formState.success && <p className="form-status form-status-success">{formState.success}</p>}

        <button type="submit" className="submit-btn" disabled={formState.submitting}>
          {formState.submitting ? 'Submitting...' : 'Submit RSVP'}
        </button>
      </form>
    </section>
  )
}
