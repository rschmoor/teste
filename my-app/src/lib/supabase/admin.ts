import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_KEY')
}

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper functions for admin operations
export const adminAuth = {
  async createUser(email: string, password: string, userData?: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: userData,
      email_confirm: true
    })
    return { data, error }
  },

  async deleteUser(userId: string) {
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    return { data, error }
  },

  async updateUser(userId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updates
    )
    return { data, error }
  },

  async listUsers(page = 1, perPage = 1000) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage
    })
    return { data, error }
  }
}