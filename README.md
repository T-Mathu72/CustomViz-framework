# {M} Framework — Bibliothèque Power Query

Site web statique pour gérer et partager vos fonctions M (Power Query).

## Stack
- **Frontend** : HTML + CSS + JavaScript pur
- **Base de données** : Supabase (PostgreSQL gratuit)
- **Hébergement** : GitHub Pages (gratuit)

---

## 🚀 Installation en 4 étapes

### 1. Créer la base de données sur Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Dans **SQL Editor**, exécutez ce script :

```sql
CREATE TABLE fonctions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom         text NOT NULL,
  categorie   text,
  description text,
  code        text NOT NULL,
  created_at  timestamp DEFAULT now()
);

-- Permettre la lecture publique
ALTER TABLE fonctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lecture publique" ON fonctions FOR SELECT USING (true);
CREATE POLICY "Insertion publique" ON fonctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Suppression publique" ON fonctions FOR DELETE USING (true);
```

### 2. Configurer vos identifiants

Dans **Settings > API** de votre projet Supabase, copiez :
- **Project URL**
- **anon / public key**

Ouvrez `config.js` et remplacez :
```js
const SUPABASE_URL = 'https://XXXX.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

### 3. Publier sur GitHub Pages

1. Créez un repo GitHub public (ex: `powerquery-m-framework`)
2. Uploadez tous les fichiers
3. Allez dans **Settings > Pages**
4. Source : `Deploy from a branch` → branche `main`, dossier `/root`
5. Votre site sera disponible à :
   `https://[votre-pseudo].github.io/powerquery-m-framework`

### 4. Utiliser le site

| Page | URL | Rôle |
|------|-----|------|
| Bibliothèque | `index.html` | Chercher, filtrer, copier les fonctions |
| Admin | `admin.html` | Ajouter ou supprimer des fonctions |

---

## 📁 Structure des fichiers

```
├── index.html    ← Page principale (bibliothèque)
├── admin.html    ← Page d'administration
├── style.css     ← Styles
├── app.js        ← Logique de la bibliothèque
├── admin.js      ← Logique d'administration
└── config.js     ← ⚠ Vos identifiants Supabase (à remplir)
```

---

## ⚠️ Sécurité

La page `admin.html` est accessible à tous.
Pour la sécuriser, vous pouvez :
- Ajouter une authentification Supabase (Auth)
- Ou simplement ne pas partager le lien de la page admin
