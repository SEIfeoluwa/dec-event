import { useState } from 'react'

import Modal from '../common/Modal'
import { createRsvp } from '../../services/rsvps'
import { rsvpSchema } from '../../schemas/rsvpSchema'
import type { RSVPInput } from '../../schemas/rsvpSchema'
import type { RsvpRecord } from '../../types/database'

interface AddRsvpModalProps {
  onClose: () => void
  onCreated: (rsvp: RsvpRecord) => void
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

export default function AddRsvpModal({ onClose, onCreated }: AddRsvpModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    const numericFields = ['maleGuestCount', 'femaleGuestCount', 'childGuestCount']

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
    setError(null)

    const parsed = rsvpSchema.safeParse(formData)

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the RSVP details.')
      return
    }

    try {
      setSubmitting(true)

      const created = await createRsvp(parsed.data)

      onCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add this RSVP.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Add RSVP" onClose={onClose}>
      <form className="add-rsvp-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="addRsvpFirstName">First Name</label>
            <input
              id="addRsvpFirstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="addRsvpLastName">Last Name</label>
            <input
              id="addRsvpLastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="addRsvpPhone">Phone</label>
          <input
            id="addRsvpPhone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(123) 456-7890"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="addRsvpAttendance">Attendance</label>
          <select
            id="addRsvpAttendance"
            name="attendance"
            value={formData.attendance}
            onChange={handleChange}
            required
          >
            <option value="">Select attendance</option>
            <option value="yes">Yes, attending</option>
            <option value="no">Not attending</option>
          </select>
        </div>

        <div className="form-row plus-ones-row">
          <div className="form-group">
            <label htmlFor="addRsvpMale">Men</label>
            <select
              id="addRsvpMale"
              name="maleGuestCount"
              value={formData.maleGuestCount}
              onChange={handleChange}
            >
              {guestCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="addRsvpFemale">Women</label>
            <select
              id="addRsvpFemale"
              name="femaleGuestCount"
              value={formData.femaleGuestCount}
              onChange={handleChange}
            >
              {guestCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="addRsvpChild">Children</label>
            <select
              id="addRsvpChild"
              name="childGuestCount"
              value={formData.childGuestCount}
              onChange={handleChange}
            >
              {guestCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="addRsvpMessage">Message (Optional)</label>
          <textarea
            id="addRsvpMessage"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Any notes"
            rows={3}
          />
        </div>

        <div className="form-group-checkbox">
          <label htmlFor="addRsvpSmsConsent">
            <input
              type="checkbox"
              id="addRsvpSmsConsent"
              name="smsConsent"
              checked={formData.smsConsent}
              onChange={handleChange}
            />
            <span>Guest consents to receive SMS updates about this event.</span>
          </label>
        </div>

        {error && <p className="form-status form-status-error">{error}</p>}

        <div className="add-rsvp-actions">
          <button
            type="button"
            className="add-rsvp-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="add-rsvp-submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add RSVP'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
