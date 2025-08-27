import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if we have valid configuration
const hasValidConfig = () => {
  return (
    supabaseUrl && 
    supabaseAnonKey &&
    !supabaseUrl.includes('your_supabase_project_url') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.startsWith('http')
  )
}

// Create a placeholder client for build time
const createPlaceholderClient = () => {
  console.warn('Supabase client created with placeholder values. Authentication will not work.')
  return createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDY5MzczMjcsImV4cCI6MTk2MjUxMzMyN30.placeholder',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}

// Create the Supabase client
export const supabase: SupabaseClient = hasValidConfig() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createPlaceholderClient()

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