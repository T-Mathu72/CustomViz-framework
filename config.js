// ============================================================
//  CONFIG SUPABASE — À remplir avec vos propres identifiants
//  1. Allez sur https://supabase.com et créez un projet
//  2. Dans Settings > API, copiez votre URL et votre anon key
//  3. Remplacez les valeurs ci-dessous
// ============================================================

const SUPABASE_URL  = 'https://fcgdefombxdwpeqmqsaa.supabase.co';   // ex: https://xxxx.supabase.co
const SUPABASE_KEY  = 'sb_publishable_5Fa_3FTu2lt2fq0bQ10soA_BFKcdYL3';        // clé publique anon

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
