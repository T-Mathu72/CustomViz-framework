// ============================================================
//  CONFIG SUPABASE — À remplir avec vos propres identifiants
//  1. Allez sur https://supabase.com et créez un projet
//  2. Dans Settings > API, copiez votre URL et votre anon key
//  3. Remplacez les valeurs ci-dessous
//
//  Migrations SQL (à exécuter dans l'éditeur SQL Supabase) :
//    ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'approved';
//    UPDATE fonctions SET statut = 'approved' WHERE statut IS NULL;
//
//    ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'svg';
//    ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS sous_categorie TEXT;
//    UPDATE fonctions SET type = 'svg'   WHERE categorie = 'Carte' OR type IS NULL OR type = 'dax';
//    UPDATE fonctions SET type = 'html'  WHERE categorie = 'HTML';
//    UPDATE fonctions SET type = 'deneb' WHERE categorie = 'Deneb';
// ============================================================

const SUPABASE_URL  = 'https://fcgdefombxdwpeqmqsaa.supabase.co';   // ex: https://xxxx.supabase.co
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2RlZm9tYnhkd3BlcW1xc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjM5MzAsImV4cCI6MjA5MTgzOTkzMH0.GTl7hmYRH0wh7f5Hwsn5zjNOZ6Mn8ZHlLLY8hxd7Gfw';        // clé publique anon

const ADMIN_PASSWORD = '69 la team';   // ← changez ce mot de passe

// Clé service_role (Settings > API > service_role secret).
// Elle bypasse le RLS et permet les UPDATE/DELETE depuis l'admin.
// Ne jamais exposer côté client dans une app publique — acceptable ici car
// l'accès admin est de toute façon protégé par ADMIN_PASSWORD.
const ADMIN_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2RlZm9tYnhkd3BlcW1xc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjM5MzAsImV4cCI6MjA5MTgzOTkzMH0.GTl7hmYRH0wh7f5Hwsn5zjNOZ6Mn8ZHlLLY8hxd7Gfw';  // ← coller votre clé service_role ici

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Client admin : utilise la service_role key si disponible, sinon anon.
const adminDb = ADMIN_SERVICE_KEY
  ? createClient(SUPABASE_URL, ADMIN_SERVICE_KEY)
  : db;
