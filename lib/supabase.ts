import { createClient } from "@supabase/supabase-js"

type Database = {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string
          title: string
          url: string
          user_id: string
          created_at: string
        }
        Insert: {
          title: string
          url: string
          user_id: string
        }
        Update: {
          title?: string
          url?: string
          user_id?: string
        }
      }
    }
  }
}

let supabaseInstance:
  | ReturnType<typeof createClient<Database>>
  | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }

    supabaseInstance = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    )
  }

  return supabaseInstance
}
