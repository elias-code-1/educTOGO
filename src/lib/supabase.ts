import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Les variables d'environnement VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY ne sont pas renseignées. " +
    "Veuillez les configurer dans les paramètres / variables d'environnement pour activer l'authentification et les Edge Functions."
  );
}

// createClient requiert une URL valide pour initialiser le client sans planter au démarrage si les variables ne sont pas encore définies
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

