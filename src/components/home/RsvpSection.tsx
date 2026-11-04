import { useState } from 'react'

import Modal from '../common/Modal'
import { createRsvp } from '../../services/rsvps'
import { rsvpSchema } from '../../schemas/rsvpSchema'
import type { RSVPInput } from '../../schemas/rsvpSchema'

type LegalModal = 'terms' | 'privacy' | null

const RSVP_CLOSED = false

interface RsvpProps {
  onRsvpClick?: () => void
}

type FormData = Omit<RSVPInput, 'attendance' | 'guestCount'> & {
  attendance: RSVPInput['attendance'] | ''
  guestCount: string
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
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
  const [activeModal, setActiveModal] = useState<LegalModal>(null)

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

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
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
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
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="attendance">Will you attend? *</label>
            <select
              id="attendance"
              name="attendance"
              value={formData.attendance}
              onChange={handleChange}
              required
            >
              <option value="">Select your attendance</option>
              <option value="yes">Yes, I'll be there!</option>
              <option value="no">Sorry, I can't make it</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="guestCount">Number of Guests *</label>
            <input
              type="number"
              id="guestCount"
              name="guestCount"
              value={formData.guestCount}
              onChange={handleChange}
              min={1}
              step={1}
              inputMode="numeric"
              required
            />
            <p className="form-helper">
              Please include yourself and everyone attending with you.
            </p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Any special notes or dietary requirements?"
              rows={4}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <p className="form-legal-links">
              <button
                type="button"
                className="form-legal-link"
                onClick={() => setActiveModal('terms')}
              >
                Terms of Service
              </button>
              {' & '}
              <button
                type="button"
                className="form-legal-link"
                onClick={() => setActiveModal('privacy')}
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>

        {formState.error && <p className="form-status form-status-error">{formState.error}</p>}
        {formState.success && <p className="form-status form-status-success">{formState.success}</p>}

        <button type="submit" className="submit-btn" disabled={formState.submitting}>
          {formState.submitting ? 'Submitting...' : 'Submit RSVP'}
        </button>
      </form>

      {activeModal === 'terms' && (
        <Modal title="Terms of Service" onClose={() => setActiveModal(null)}>
          <p>
            By submitting this RSVP, you confirm that the information you
            provide is accurate and that you are submitting on behalf of
            yourself and the guests listed in your party.
          </p>
          <p>
            RSVP entries may be edited or removed by the event organizers,
            including to correct guest counts or contact details.
          </p>
        </Modal>
      )}

      {activeModal === 'privacy' && (
        <Modal title="Privacy Policy" onClose={() => setActiveModal(null)}>
          <p>
            The Fayemi family collects the information submitted through
            this form, including your name, phone number, attendance
            status, guest counts, and any message you provide, solely to
            plan and manage this event.
          </p>
          <p>
            Your information is not sold, rented, or shared outside of what
            is necessary to plan this event (for example, coordinating
            seating or catering counts), and is retained only for as long
            as needed for that purpose.
          </p>
          <p>
            If you have questions about your information or would like it
            removed, please contact the Fayemi family directly.
          </p>
        </Modal>
      )}
    </section>
  )
}
