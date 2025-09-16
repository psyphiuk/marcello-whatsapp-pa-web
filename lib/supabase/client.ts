import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export a singleton instance for backward compatibility
export const supabase = createSupabaseBrowser()

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