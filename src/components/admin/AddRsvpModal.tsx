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

export default function AddRsvpModal({ onClose, onCreated }: AddRsvpModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
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

        <div className="form-group">
          <label htmlFor="addRsvpGuestCount">Number of Guests</label>
          <input
            id="addRsvpGuestCount"
            name="guestCount"
            type="number"
            value={formData.guestCount}
            onChange={handleChange}
            min={1}
            step={1}
            inputMode="numeric"
            required
          />
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
