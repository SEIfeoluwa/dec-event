import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AddRsvpModal from '../components/admin/AddRsvpModal'
import { deleteRsvp, getRsvpDashboardStats, updateRsvp } from '../services/rsvps'
import { supabase } from '../services/supabase'
import type { RsvpDashboardStats } from '../services/rsvps'
import type {
  AttendanceStatus,
  RsvpRecord,
  UpdateRsvpRecord,
} from '../types/database'

function formatPhoneDisplay(phone: string): string {
  return phone.replace(/\D/g, '')
}

function formatNameDisplay(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function toEditForm(rsvp: RsvpRecord): UpdateRsvpRecord {
  return {
    first_name: rsvp.first_name,
    last_name: rsvp.last_name,
    phone: rsvp.phone,
    attendance: rsvp.attendance,
    guest_count: rsvp.guest_count,
    message: rsvp.message,
  }
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const [rsvps, setRsvps] = useState<RsvpRecord[]>([])
  const [stats, setStats] = useState<RsvpDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingRsvpId, setEditingRsvpId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<UpdateRsvpRecord | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [savingRsvpId, setSavingRsvpId] = useState<string | null>(null)
  const [deletingRsvpId, setDeletingRsvpId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!supabase) {
          throw new Error('Missing Supabase environment variables.')
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          navigate('/admin/login', { replace: true })
          return
        }

        const [rsvpResult, statsResult] = await Promise.all([
          supabase
            .from('rsvps')
            .select('*')
            .order('first_name', { ascending: true }),

          getRsvpDashboardStats(),
        ])

        if (rsvpResult.error) {
          throw rsvpResult.error
        }

        setRsvps((rsvpResult.data ?? []) as RsvpRecord[])
        setStats(statsResult)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred while loading the dashboard',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  const handleStartEdit = (rsvp: RsvpRecord) => {
    setEditingRsvpId(rsvp.id)
    setEditForm(toEditForm(rsvp))
    setEditError(null)
  }

  const handleCancelEdit = () => {
    setEditingRsvpId(null)
    setEditForm(null)
    setEditError(null)
  }

  const updateEditField = <Field extends keyof UpdateRsvpRecord>(
    field: Field,
    value: UpdateRsvpRecord[Field],
  ) => {
    setEditForm((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        [field]: value,
      }
    })
  }

  const validateEditForm = (form: UpdateRsvpRecord) => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      return 'First and last name are required.'
    }

    if (!form.phone.trim()) {
      return 'Phone number is required.'
    }

    if (!Number.isInteger(form.guest_count) || form.guest_count < 1) {
      return 'Guest count must be a whole number of at least 1.'
    }

    if ((form.message?.length ?? 0) > 500) {
      return 'Message cannot exceed 500 characters.'
    }

    return null
  }

  const refreshStats = async () => {
    setStats(await getRsvpDashboardStats())
  }

  const handleRsvpCreated = async (newRsvp: RsvpRecord) => {
    setRsvps((currentRsvps) =>
      [...currentRsvps, newRsvp].sort((a, b) =>
        a.first_name.localeCompare(b.first_name),
      ),
    )
    await refreshStats()
  }

  const handleSaveEdit = async (id: string) => {
    if (!editForm) {
      return
    }

    const validationError = validateEditForm(editForm)

    if (validationError) {
      setEditError(validationError)
      return
    }

    try {
      setSavingRsvpId(id)
      setEditError(null)

      const updatedRsvp = await updateRsvp(id, editForm)

      setRsvps((currentRsvps) =>
        currentRsvps.map((rsvp) => (rsvp.id === id ? updatedRsvp : rsvp)),
      )
      await refreshStats()
      handleCancelEdit()
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Unable to update this RSVP.',
      )
    } finally {
      setSavingRsvpId(null)
    }
  }

  const handleDeleteRsvp = async (rsvp: RsvpRecord) => {
    const shouldDelete = window.confirm(
      `Delete RSVP for ${rsvp.first_name} ${rsvp.last_name}? This cannot be undone.`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      setDeletingRsvpId(rsvp.id)
      setEditError(null)

      await deleteRsvp(rsvp.id)

      setRsvps((currentRsvps) =>
        currentRsvps.filter((currentRsvp) => currentRsvp.id !== rsvp.id),
      )

      if (editingRsvpId === rsvp.id) {
        handleCancelEdit()
      }

      await refreshStats()
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Unable to delete this RSVP.',
      )
    } finally {
      setDeletingRsvpId(null)
    }
  }

  const handleLogout = async () => {
    if (!supabase) {
      navigate('/admin/login', { replace: true })
      return
    }

    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  if (error) {
    return <div className="admin-error">Error: {error}</div>
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredRsvps = normalizedQuery
    ? rsvps.filter((rsvp) =>
        [rsvp.first_name, rsvp.last_name, rsvp.phone]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : rsvps

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>

      <div className="admin-tabbar">
        <button
          type="button"
          className="admin-tabbar-logout"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      {stats && (
        <section className="dashboard-stats dashboard-stats-full">
          <article className="stat-card">
            <h2>{stats.total_responses}</h2>
            <p>Total Responses</p>
          </article>

          <article className="stat-card">
            <h2>{stats.yes_responses}</h2>
            <p>Yes Responses</p>
          </article>

          <article className="stat-card">
            <h2>{stats.no_responses}</h2>
            <p>No Responses</p>
          </article>

          <article className="stat-card">
            <h2>{stats.total_attending_guests}</h2>
            <p>Total Guests Attending</p>
          </article>

          <div className="admin-search">
            <input
              type="search"
              className="admin-search-input"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search RSVPs"
            />
          </div>
        </section>
      )}

      <div className="admin-toolbar">
        <button
          type="button"
          className="admin-action-button"
          onClick={() => setShowAddModal(true)}
        >
          Add RSVP
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <colgroup>
            <col className="admin-col-name" />
            <col className="admin-col-name" />
            <col className="admin-col-phone" />
            <col className="admin-col-status" />
            <col className="admin-col-total" />
            <col className="admin-col-message" />
            <col className="admin-col-actions" />
          </colgroup>

          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Phone</th>
              <th>Attendance</th>
              <th>Guests</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredRsvps.length > 0 ? (
              filteredRsvps.map((rsvp) => {
                const isEditing = editingRsvpId === rsvp.id && editForm

                return (
                  <tr key={rsvp.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className="admin-table-input"
                          value={editForm.first_name}
                          onChange={(event) =>
                            updateEditField('first_name', event.target.value)
                          }
                          aria-label="First name"
                        />
                      ) : (
                        rsvp.first_name
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          className="admin-table-input"
                          value={editForm.last_name}
                          onChange={(event) =>
                            updateEditField('last_name', event.target.value)
                          }
                          aria-label="Last name"
                        />
                      ) : (
                        formatNameDisplay(rsvp.last_name)
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          className="admin-table-input"
                          value={editForm.phone}
                          onChange={(event) =>
                            updateEditField('phone', event.target.value)
                          }
                          aria-label="Phone"
                        />
                      ) : rsvp.phone ? (
                        formatPhoneDisplay(rsvp.phone)
                      ) : (
                        'N/A'
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <select
                          className="admin-table-input"
                          value={editForm.attendance}
                          onChange={(event) =>
                            updateEditField(
                              'attendance',
                              event.target.value as AttendanceStatus,
                            )
                          }
                          aria-label="Attendance"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      ) : (
                        <span
                          className={`attendance-badge attendance-${rsvp.attendance}`}
                        >
                          {rsvp.attendance}
                        </span>
                      )}
                    </td>

                    <td className="guest-count">
                      {isEditing ? (
                        <input
                          type="number"
                          className="admin-table-input admin-count-input"
                          value={editForm.guest_count}
                          min={1}
                          step={1}
                          onChange={(event) =>
                            updateEditField(
                              'guest_count',
                              Number(event.target.value),
                            )
                          }
                          aria-label="Guests"
                        />
                      ) : (
                        rsvp.guest_count
                      )}
                    </td>

                    <td className="message-cell">
                      {isEditing ? (
                        <textarea
                          className="admin-table-input admin-message-input"
                          value={editForm.message ?? ''}
                          onChange={(event) =>
                            updateEditField('message', event.target.value)
                          }
                          aria-label="Message"
                          rows={3}
                        />
                      ) : (
                        rsvp.message || 'No message'
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() => handleSaveEdit(rsvp.id)}
                            disabled={savingRsvpId === rsvp.id}
                          >
                            {savingRsvpId === rsvp.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="admin-action-button admin-action-secondary"
                            onClick={handleCancelEdit}
                            disabled={savingRsvpId === rsvp.id}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-action-button"
                            onClick={() => handleStartEdit(rsvp)}
                            disabled={deletingRsvpId === rsvp.id}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-action-button admin-action-danger"
                            onClick={() => handleDeleteRsvp(rsvp)}
                            disabled={deletingRsvpId === rsvp.id}
                          >
                            {deletingRsvpId === rsvp.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={11} className="no-data">
                  {normalizedQuery
                    ? 'No RSVPs match your search'
                    : 'No RSVPs found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editError && (
        <div className="admin-edit-error">Error: {editError}</div>
      )}

      {showAddModal && (
        <AddRsvpModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleRsvpCreated}
        />
      )}
    </div>
  )
}
