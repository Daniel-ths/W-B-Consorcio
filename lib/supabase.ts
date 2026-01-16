import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Verificação simples para garantir que as variáveis existem
if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.");
}

// SEM opções manuais de 'lock' ou 'auth'.
// Deixamos a biblioteca decidir a melhor configuração sozinha.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);