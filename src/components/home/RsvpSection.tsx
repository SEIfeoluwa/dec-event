import { useLayoutEffect, useRef, useState } from 'react'

import { MEALS, RSVP_LIMITS } from '../../../shared/rsvp'
import type { MealChoice } from '../../../shared/rsvp'
import Modal from '../common/Modal'
import { createRsvp } from '../../services/rsvps'
import { rsvpSchema } from '../../schemas/rsvpSchema'
import type { RSVPInput } from '../../schemas/rsvpSchema'

const RSVP_CLOSED = false

// Keep in sync with public/pastor-adebisi-60th.ics
const GOOGLE_CALENDAR_URL = `https://calendar.google.com/calendar/render?${new URLSearchParams({
  action: 'TEMPLATE',
  text: "Pastor Mrs Adebisi's 60th Birthday Celebration",
  dates: '20261208T230000Z/20261209T020000Z',
  details: 'Dress code: Grace & Royalty. Color of the day: Touch of Blue.',
  location: '1625 Olive St NE, Washington, DC 20019',
})}`

interface RsvpProps {
  onRsvpClick?: () => void
}

type FormData = Omit<RSVPInput, 'attendance' | 'guestCount' | 'meal'> & {
  attendance: RSVPInput['attendance'] | ''
  guestCount: string
  meal: MealChoice | ''
}

const initialFormData: FormData = {
  fullName: '',
  phone: '',
  attendance: '',
  guestCount: '1',
  message: '',
  meal: '',
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
  // Attending guests choose a meal in a pop-up before the RSVP is sent
  const [mealPickerOpen, setMealPickerOpen] = useState(false)
  const [showCalendarLinks, setShowCalendarLinks] = useState(false)

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

  const submitRsvp = async (data: FormData) => {
    setFormState({ submitting: true, error: null, success: null })
    setShowCalendarLinks(false)

    const parsed = rsvpSchema.safeParse(data)

    if (!parsed.success) {
      setMealPickerOpen(false)
      setFormState({
        submitting: false,
        error: parsed.error.issues[0]?.message ?? 'Please check your RSVP details.',
        success: null,
      })
      return
    }

    try {
      await createRsvp(parsed.data)
      setMealPickerOpen(false)
      setFormData(initialFormData)
      setShowCalendarLinks(parsed.data.attendance === 'yes')
      setFormState({
        submitting: false,
        error: null,
        success: 'Thank you. Your RSVP has been submitted.',
      })
      onRsvpClick?.()
    } catch (err) {
      // Back to the form so they can fix it (e.g. a phone number already used);
      // their meal choice is kept for the next try.
      setMealPickerOpen(false)
      setFormState({
        submitting: false,
        error: err instanceof Error ? err.message : 'Unable to submit your RSVP.',
        success: null,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check the form first, so the meal pop-up only opens once it's valid
    const parsed = rsvpSchema.safeParse(formData)

    if (!parsed.success) {
      setFormState({
        submitting: false,
        error: parsed.error.issues[0]?.message ?? 'Please check your RSVP details.',
        success: null,
      })
      return
    }

    if (parsed.data.attendance === 'yes') {
      setFormState({ submitting: false, error: null, success: null })
      setShowCalendarLinks(false)
      setMealPickerOpen(true)
      return
    }

    void submitRsvp(formData)
  }

  const closeMealPicker = () => {
    if (!formState.submitting) setMealPickerOpen(false)
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
      <p>Please respond by November 29</p>

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
        {showCalendarLinks && (
          <div className="calendar-links">
            <p>Add a reminder to your calendar:</p>
            <a href={GOOGLE_CALENDAR_URL} target="_blank" rel="noopener noreferrer">
              Google Calendar
            </a>
            <a href="/pastor-adebisi-60th.ics">Apple / Outlook</a>
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={formState.submitting}>
          {formState.submitting ? 'Submitting...' : 'Submit RSVP'}
        </button>
      </form>

      {mealPickerOpen && (
        <Modal title="Choose your meal" onClose={closeMealPicker}>
          <p>
            {guestCountValue > 1
              ? 'Please choose one meal for your party.'
              : 'Please choose your meal for the celebration.'}
          </p>

          <div className="meal-options" role="radiogroup" aria-label="Meal">
            {MEALS.map((meal, index) => (
              <button
                key={meal.id}
                type="button"
                role="radio"
                aria-checked={formData.meal === meal.id}
                className="meal-option"
                onClick={() => setFormData((prev) => ({ ...prev, meal: meal.id }))}
                autoFocus={formData.meal ? formData.meal === meal.id : index === 0}
              >
                {meal.label}
              </button>
            ))}
          </div>

          <div className="meal-actions">
            <button
              type="button"
              className="add-rsvp-cancel"
              onClick={closeMealPicker}
              disabled={formState.submitting}
            >
              Back
            </button>
            <button
              type="button"
              className="add-rsvp-submit"
              onClick={() => void submitRsvp(formData)}
              disabled={!formData.meal || formState.submitting}
            >
              {formState.submitting ? 'Submitting...' : 'Confirm & Submit RSVP'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}
