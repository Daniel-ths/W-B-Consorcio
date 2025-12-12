import { createClient } from '@supabase/supabase-js';

// Busca as chaves que configuramos no .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cria a conexão
export const supabase = createClient(supabaseUrl, supabaseKey);