import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Usamos createBrowserClient para que ele gerencie os Cookies automaticamente
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)