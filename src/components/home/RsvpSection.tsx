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

type FormData = Omit<RSVPInput, 'attendance'> & {
  attendance: RSVPInput['attendance'] | ''
}

const guestCountOptions = Array.from({ length: 3 }, (_, count) => count)

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  phone: '',
  smsConsent: false,
  attendance: '',
  maleGuestCount: 0,
  femaleGuestCount: 0,
  childGuestCount: 0,
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
    const { name, value, type } = e.target
    const numericFields = [
      'maleGuestCount',
      'femaleGuestCount',
      'childGuestCount',
    ]

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : numericFields.includes(name)
            ? Number(value)
            : value,
    }))
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

        <div className="form-row plus-ones-row">
          <h3 className="form-subheader">Total Attending</h3>
          <p className="form-helper">
            Please include yourself and everyone attending with you.
          </p>

          <div className="form-group">
            <label htmlFor="maleGuestCount">Men</label>
            <select
              id="maleGuestCount"
              name="maleGuestCount"
              value={formData.maleGuestCount}
              onChange={handleChange}
              required
            >
              {guestCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="femaleGuestCount">Women</label>
            <select
              id="femaleGuestCount"
              name="femaleGuestCount"
              value={formData.femaleGuestCount}
              onChange={handleChange}
              required
            >
              {guestCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="childGuestCount">Children</label>
            <select
              id="childGuestCount"
              name="childGuestCount"
              value={formData.childGuestCount}
              onChange={handleChange}
              required
            >
              {guestCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
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
          <div className="form-group full-width form-group-checkbox">
            <label htmlFor="smsConsent">
              <input
                type="checkbox"
                id="smsConsent"
                name="smsConsent"
                checked={formData.smsConsent}
                onChange={handleChange}
              />
              <span>
                <strong>SMS updates (optional):</strong> I consent to receive
                text messages from the Fayemi family about this event,
                including updates and reminders. Message frequency may vary.
                Message & data rates may apply. Reply STOP to opt out, HELP
                for help. This is not required to submit your RSVP.
              </span>
            </label>

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
            <strong>SMS Program.</strong> If you check the SMS consent box,
            you agree to receive text messages from the Fayemi family at the
            phone number you provided, related to this event (such as date
            reminders, schedule changes, or logistics updates). Message
            frequency may vary. Message and data rates may apply based on
            your carrier and plan. Consent to receive texts is not required
            to submit your RSVP.
          </p>
          <p>
            You can opt out of text messages at any time by replying STOP to
            any message. Reply HELP for assistance.
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
            <strong>SMS consent.</strong> SMS consent is optional and is not
            required to submit your RSVP. If you opt in to receive text
            messages, your phone number is used only to send you updates
            related to this event. Your phone number and SMS consent status
            are not shared with third parties or used for marketing
            purposes.
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
