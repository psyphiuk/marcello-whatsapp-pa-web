import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          company_name: string
          phone_numbers: string[]
          plan: 'basic' | 'pro'
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          company_name: string
          phone_numbers: string[]
          plan?: 'basic' | 'pro'
          settings?: Record<string, any>
        }
        Update: {
          company_name?: string
          phone_numbers?: string[]
          plan?: 'basic' | 'pro'
          settings?: Record<string, any>
          updated_at?: string
        }
      }
      credentials: {
        Row: {
          id: string
          customer_id: string
          service: string
          credentials: Record<string, any>
          expires_at: string | null
          created_at: string
        }
        Insert: {
          customer_id: string
          service: string
          credentials: Record<string, any>
          expires_at?: string | null
        }
        Update: {
          credentials?: Record<string, any>
          expires_at?: string | null
        }
      }
      usage_metrics: {
        Row: {
          id: string
          customer_id: string
          date: string
          message_count: number
          api_calls: Record<string, number>
          tokens_used: number
        }
        Insert: {
          customer_id: string
          date: string
          message_count?: number
          api_calls?: Record<string, number>
          tokens_used?: number
        }
        Update: {
          message_count?: number
          api_calls?: Record<string, number>
          tokens_used?: number
        }
      }
    }
  }
}