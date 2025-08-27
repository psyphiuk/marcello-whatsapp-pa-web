import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Use placeholder values for build time if env vars are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDY5MzczMjcsImV4cCI6MTk2MjUxMzMyN30.placeholder'

// Check if we have valid URLs (not example/placeholder values)
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return !url.includes('your_supabase_project_url') && 
           !url.includes('placeholder') &&
           parsed.protocol.startsWith('http')
  } catch {
    return false
  }
}

// Create client, using placeholder for build if needed
export const supabase: SupabaseClient = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDY5MzczMjcsImV4cCI6MTk2MjUxMzMyN30.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

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