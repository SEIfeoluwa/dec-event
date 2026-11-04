import { FunctionsHttpError } from '@supabase/supabase-js'

import { supabase } from './supabase'

export interface SendSmsResult {
  success: boolean
  sent: number
  failed: number
  failures: Array<{ to: string; error?: string }>
}

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Missing Supabase environment variables.')
  }

  return supabase
}

async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (typeof body?.error === 'string') {
        return body.error
      }
    } catch {
      // response body wasn't JSON — fall through to the generic message below
    }
  }

  return error instanceof Error ? error.message : fallback
}

export async function sendSms(body: string): Promise<SendSmsResult> {
  const client = getSupabaseClient()

  const { data, error } = await client.functions.invoke<SendSmsResult>('send-sms', {
    body: { body },
  })

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, 'Unable to send SMS.'))
  }

  if (!data) {
    throw new Error('No response received from send-sms function.')
  }

  return data
}
