// ============================================================
//  CONFIG SUPABASE — À remplir avec vos propres identifiants
//  1. Allez sur https://supabase.com et créez un projet
//  2. Dans Settings > API, copiez votre URL et votre anon key
//  3. Remplacez les valeurs ci-dessous
//
//  Migration SQL requise (à exécuter une seule fois dans l'éditeur SQL Supabase) :
//    ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'approved';
//    UPDATE fonctions SET statut = 'approved' WHERE statut IS NULL;
// ============================================================

const SUPABASE_URL  = 'https://fcgdefombxdwpeqmqsaa.supabase.co';   // ex: https://xxxx.supabase.co
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2RlZm9tYnhkd3BlcW1xc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjM5MzAsImV4cCI6MjA5MTgzOTkzMH0.GTl7hmYRH0wh7f5Hwsn5zjNOZ6Mn8ZHlLLY8hxd7Gfw';        // clé publique anon

const ADMIN_PASSWORD = '69 la team';   // ← changez ce mot de passe

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
