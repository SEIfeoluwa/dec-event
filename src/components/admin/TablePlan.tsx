import { useEffect, useState } from 'react'

import { supabase } from '../../services/supabase'
import {
  assignRsvpToTable,
  createTable,
  deleteTable,
  getTablePlan,
  getTables,
} from '../../services/tables'
import type { RsvpRecord, TablePlanRow, TableRecord } from '../../types/database'

const emptyNewTable = { name: '', max_capacity: 12 }

type TablePlanData = {
  tables: TableRecord[]
  tablePlan: TablePlanRow[]
  rsvps: RsvpRecord[]
}

async function loadTablePlanData(): Promise<TablePlanData> {
  if (!supabase) {
    throw new Error('Missing Supabase environment variables.')
  }

  const [tables, tablePlan, rsvpsResult] = await Promise.all([
    getTables(),
    getTablePlan(),
    supabase
      .from('rsvps')
      .select('*')
      .eq('attendance', 'yes')
      .order('first_name', { ascending: true }),
  ])

  if (rsvpsResult.error) {
    throw rsvpsResult.error
  }

  return {
    tables,
    tablePlan,
    rsvps: (rsvpsResult.data ?? []) as RsvpRecord[],
  }
}

export default function TablePlan() {
  const [tables, setTables] = useState<TableRecord[]>([])
  const [tablePlan, setTablePlan] = useState<TablePlanRow[]>([])
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTable, setNewTable] = useState(emptyNewTable)
  const [creatingTable, setCreatingTable] = useState(false)
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null)
  const [assigningRsvpId, setAssigningRsvpId] = useState<string | null>(null)

  const refreshTablePlan = async () => {
    try {
      setError(null)

      const data = await loadTablePlanData()

      setTables(data.tables)
      setTablePlan(data.tablePlan)
      setRsvps(data.rsvps)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load the table plan.',
      )
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await loadTablePlanData()

        setTables(data.tables)
        setTablePlan(data.tablePlan)
        setRsvps(data.rsvps)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load the table plan.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  const handleCreateTable = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!newTable.name.trim() || newTable.max_capacity < 1) {
      setError('Table name and a capacity of at least 1 are required.')
      return
    }

    try {
      setCreatingTable(true)
      setError(null)

      await createTable({
        name: newTable.name.trim(),
        max_capacity: newTable.max_capacity,
      })

      setNewTable(emptyNewTable)
      await refreshTablePlan()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create table.')
    } finally {
      setCreatingTable(false)
    }
  }

  const handleDeleteTable = async (table: TableRecord) => {
    const shouldDelete = window.confirm(`Delete table "${table.name}"?`)

    if (!shouldDelete) {
      return
    }

    try {
      setDeletingTableId(table.id)
      setError(null)

      await deleteTable(table.id)
      await refreshTablePlan()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete table.')
    } finally {
      setDeletingTableId(null)
    }
  }

  const handleAssignTable = async (rsvpId: string, tableId: string) => {
    try {
      setAssigningRsvpId(rsvpId)
      setError(null)

      await assignRsvpToTable(rsvpId, tableId || null)
      await refreshTablePlan()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to assign guest to table.',
      )
    } finally {
      setAssigningRsvpId(null)
    }
  }

  if (loading) {
    return <div className="table-plan-loading">Loading table plan...</div>
  }

  const unassignedRsvps = rsvps.filter((rsvp) => !rsvp.table_id)

  return (
    <div className="table-plan">
      {error && <div className="admin-edit-error">Error: {error}</div>}

      <form className="table-plan-new-table" onSubmit={handleCreateTable}>
        <input
          type="text"
          placeholder="Table name"
          value={newTable.name}
          onChange={(event) =>
            setNewTable((current) => ({ ...current, name: event.target.value }))
          }
          aria-label="New table name"
        />
        <input
          type="number"
          min={1}
          value={newTable.max_capacity}
          onChange={(event) =>
            setNewTable((current) => ({
              ...current,
              max_capacity: Number(event.target.value),
            }))
          }
          aria-label="New table capacity"
        />
        <button type="submit" disabled={creatingTable}>
          {creatingTable ? 'Adding...' : 'Add Table'}
        </button>
      </form>

      <div className="table-plan-grid">
        {tables.map((table) => {
          const planRow = tablePlan.find((row) => row.table_id === table.id)
          const seatsAssigned = planRow?.seats_assigned ?? 0
          const guestsAtTable = rsvps.filter(
            (rsvp) => rsvp.table_id === table.id,
          )

          return (
            <article key={table.id} className="table-plan-card">
              <header>
                <h3>{table.name}</h3>
                <button
                  type="button"
                  className="admin-action-button admin-action-danger"
                  onClick={() => handleDeleteTable(table)}
                  disabled={deletingTableId === table.id}
                >
                  {deletingTableId === table.id ? 'Deleting...' : 'Delete'}
                </button>
              </header>

              <p className="table-plan-capacity">
                {seatsAssigned} / {table.max_capacity} seats
              </p>

              <ul className="table-plan-guest-list">
                {guestsAtTable.length > 0 ? (
                  guestsAtTable.map((rsvp) => (
                    <li key={rsvp.id}>
                      <span>
                        {rsvp.first_name} {rsvp.last_name} ({rsvp.guest_count})
                      </span>
                      <select
                        value={rsvp.table_id ?? ''}
                        onChange={(event) =>
                          handleAssignTable(rsvp.id, event.target.value)
                        }
                        disabled={assigningRsvpId === rsvp.id}
                        aria-label={`Table for ${rsvp.first_name} ${rsvp.last_name}`}
                      >
                        <option value="">Unassigned</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))
                ) : (
                  <li className="table-plan-empty">No guests assigned</li>
                )}
              </ul>
            </article>
          )
        })}

        {tables.length === 0 && (
          <p className="table-plan-empty">No tables yet. Add one above.</p>
        )}
      </div>

      <div className="table-plan-unassigned">
        <h3>Unassigned Guests ({unassignedRsvps.length})</h3>

        {unassignedRsvps.length > 0 ? (
          <ul className="table-plan-guest-list">
            {unassignedRsvps.map((rsvp) => (
              <li key={rsvp.id}>
                <span>
                  {rsvp.first_name} {rsvp.last_name} ({rsvp.guest_count})
                </span>
                <select
                  value=""
                  onChange={(event) =>
                    handleAssignTable(rsvp.id, event.target.value)
                  }
                  disabled={assigningRsvpId === rsvp.id}
                  aria-label={`Table for ${rsvp.first_name} ${rsvp.last_name}`}
                >
                  <option value="" disabled>
                    Assign to table
                  </option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        ) : (
          <p className="table-plan-empty">Everyone is assigned to a table.</p>
        )}
      </div>
    </div>
  )
}
