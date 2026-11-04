import { supabase } from './supabase'
import type {
  NewTableRecord,
  RsvpRecord,
  TablePlanRow,
  TableRecord,
  UpdateTableRecord,
} from '../types/database'

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Missing Supabase environment variables.')
  }

  return supabase
}

export async function getTables(): Promise<TableRecord[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('tables')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as TableRecord[]
}

export async function getTablePlan(): Promise<TablePlanRow[]> {
  const client = getSupabaseClient()

  const { data, error } = await client.rpc('get_table_plan')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as TablePlanRow[]
}

export async function createTable(input: NewTableRecord): Promise<TableRecord> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('tables')
    .insert(input)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as TableRecord
}

export async function updateTable(
  id: string,
  input: UpdateTableRecord,
): Promise<TableRecord> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('tables')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as TableRecord
}

export async function deleteTable(id: string): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client.from('tables').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function assignRsvpToTable(
  rsvpId: string,
  tableId: string | null,
): Promise<RsvpRecord> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('rsvps')
    .update({ table_id: tableId })
    .eq('id', rsvpId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as RsvpRecord
}

export type TableLookupResult = {
  firstName: string
  lastName: string
  partySize: number
  tableId: string | null
  tableName: string | null
}

type FindMyTableRow = {
  first_name: string
  last_name: string
  party_size: number
  table_id: string | null
  table_name: string | null
}

export async function findMyTable(searchName: string): Promise<TableLookupResult[]> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('find_my_table', { search_name: searchName })

  if (error) throw error

  return ((data ?? []) as FindMyTableRow[]).map((row) => ({
    firstName: row.first_name,
    lastName: row.last_name,
    partySize: row.party_size,
    tableId: row.table_id,
    tableName: row.table_name
  }))
}