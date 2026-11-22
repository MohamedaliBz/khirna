# KHIRNA · خيرنا

> « نستثمروا في أرضنا، ونكبروا بخيرنا » — *Investissons dans notre terre, grandissons avec ses fruits*

Prototype de plateforme tunisienne d'**investissement participatif agricole** (hackathon).
Des citoyens financent des projets agricoles réels dès 100 DT, suivent leur avancement (photos datées, étapes, dépenses), demandent des visites et reçoivent une part des bénéfices. L'**État** met à disposition des terres domaniales (il en reste propriétaire) et co-investit avec des agriculteurs sans terre.

**Tout est simulé** : aucun paiement réel, aucune donnée envoyée à un serveur. Les données vivent dans le navigateur (localStorage).

## Principes visibles dans l'interface

- **Séquestre** : l'argent investi reste bloqué sur le projet.
- **Déblocage par tranches** : chaque tranche n'est versée à l'agriculteur qu'après validation de l'étape (preuve photo) par l'admin.
- **Clé de répartition** du bénéfice net affichée sur chaque projet (anneau SVG).
- **Aucun rendement garanti** : bandeau de risque sur chaque fiche.
- **Terre de l'État** : badge « mise à disposition jusqu'au … », jamais un actif du projet.

## Comptes de démonstration (connexion en un clic)

| Compte | Rôle |
|---|---|
| Amine Ben Salah | Citoyen investisseur (portefeuille simulé 5 000 DT, 2 investissements) |
| Hédi Trabelsi | Agriculteur type 1 (Béja, vaches laitières + fourrage) |
| Salma Gharbi | Agriculteur type 2 (Siliana, sans terre, projet tripartite avec l'État) |
| Ministère des Domaines de l'État – agent régional | Agent de l'État |
| Admin KHIRNA | Administrateur |

Le menu du compte (avatar en haut à droite) permet de **basculer d'un compte à l'autre** et de **réinitialiser la démo**.

## Scénario de démo (3 minutes)

1. **Accueil → Découvrir les projets → « 10 vaches laitières – Béja » → Investir** → entrer en tant qu'Amine → 500 DT → cocher « J'ai compris les risques » → confirmer → écran de succès → **Voir mon tableau de bord** (le solde passe à 4 500 DT).
2. Retour sur la fiche → **Demander une visite** → envoyer. Menu → **Hédi** → *Demandes de visite* : **Confirmer** → **Publier une actualité** (type *Preuve d'étape*, projet « Luzerne et avoine », texte + photo d'exemple) → Envoyer.
3. Menu → **Admin** → onglet *Preuves d'étape* → **Valider et débloquer 3 000 DT** → la tranche est versée à Hédi (notification dans sa cloche).
4. Menu → **Agent de l'État** → **Publier une parcelle** (Le Kef, clic sur la carte) → sélectionner « Domaine de Nebeur – lot 3 » → **Retenir** le meilleur score → **Fixer le co-investissement**.
5. Menu → **Admin** → onglet *Déclarations de récolte* → « Oliveraie – Kasserine » → **Valider et distribuer** → menu → **Amine** : *Gains reçus* ≈ 338 DT (+1 500 DT de capital restitué).
6. À tout moment : bouton **العربية / Français** dans l'en-tête → toute l'interface passe en arabe (RTL).

En cas de besoin : menu → **Réinitialiser la démo** restaure toutes les données.

## Commandes (Windows / PowerShell)

```powershell
cd "C:\Users\moham\OneDrive\Bureau\liltech3.0"
node -v                      # Node 18 ou plus requis
npm install
npm run dev                  # http://localhost:5173
npm run build                # vérification TypeScript + build de production (dist/)
npm run preview -- --host    # ouvrir l'URL "Network" sur un téléphone connecté au même Wi-Fi
```

Sur téléphone : ouvrir l'URL puis « Ajouter à l'écran d'accueil » (PWA installable).

## Base de données Supabase (optionnelle)

Sans configuration, l'app tourne **en local** (données dans le navigateur). Pour partager les données entre tous les appareils (téléphones du jury + ordinateur) :

1. Créer un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → coller le contenu de `supabase/schema.sql` → **Run** (crée les 12 tables, les accès et le temps réel).
3. Copier `.env.example` en `.env.local` et y mettre l'URL du projet et la clé publique `anon` (Project Settings → API).
4. Relancer `npm run dev` (ou `npm run build`). Au premier lancement, les données de démo sont envoyées automatiquement dans la base.

Le point de couleur dans l'en-tête indique l'état : vert = base connectée, gris = mode local, rouge = base injoignable (l'app continue en local). « Réinitialiser la démo » remet alors la base partagée à zéro pour tous les appareils.

⚠ Prototype : la clé publique donne accès en lecture/écriture à toutes les tables. Ne jamais y mettre de vraies données.

## Assistant IA (chatbot)

Une bulle en bas à droite ouvre l'assistant KHIRNA : questions en français, arabe ou derja, réponses générées à partir des documents KHIRNA (backend FastAPI + RAG + Groq, dossier `assistant/khirna-ai-assistant`). Sans backend lancé, la bulle affiche « hors ligne » et le reste de l'app fonctionne normalement.

```powershell
cd "C:\Users\moham\OneDrive\Bureau\liltech3.0\assistant\khirna-ai-assistant"
py -3.12 -m venv .venv                                         # une seule fois
.\.venv\Scripts\python.exe -m pip install -r requirements.txt  # une seule fois
.\.venv\Scripts\python.exe run.py                              # http://127.0.0.1:8000
```

- La clé Groq reste dans `assistant/khirna-ai-assistant/.env` (jamais dans le site).
- `CORS_ORIGINS` de ce `.env` doit contenir l'adresse du site (ex. `http://localhost:5173`).
- L'URL du backend côté site se règle avec `VITE_ASSISTANT_URL` dans `.env.local`.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind CSS 3 · React Router 6 · Zustand (persist → localStorage) · Supabase (optionnel) · Leaflet + OpenStreetMap · vite-plugin-pwa · lucide-react · police Cairo.

## Organisation du code

```
src/
  types.ts            Modèle de données (User, Project, Milestone, Investment, Escrow, …)
  data/seed.ts        Données de démo (10 projets, 4 parcelles, investissements, actualités…)
  store/              Store Zustand persistant (= backend simulé) + sélecteurs dérivés
  services/           Toute la logique métier (investir, débloquer une tranche, distribuer,
                      candidatures, visites…) — à remplacer plus tard par des appels API
  i18n/               fr.ts / ar.ts (clés typées : une clé manquante = erreur de compilation)
  components/         ProjectCard, ProgressBar, MilestoneTimeline, SplitDonut, MapView, StatCard…
  pages/              Accueil, Connexion, Catalogue, Fiche, Investir, tableaux de bord,
                      Assistant de création, Terres de l'État, Espace État, Admin, Notifications
```

### Règles métier implémentées

- Projet : `draft → submitted → (needs_changes) → funding → funded → in_progress → harvest → distributed` (+ `rejected`) ; passage automatique en `funded` à 100 %.
- Un investissement ne dépasse ni le solde ni le reste à financer ; il va au séquestre du projet.
- Valider une preuve d'étape débloque la tranche (séquestre ↓, portefeuille agriculteur ↑).
- Distribution : bénéfice net = CA − coûts ; capital restitué, puis part investisseurs répartie au prorata des montants (État compris) ; parts agriculteur, KHIRNA et réserve selon la clé.
- Valider un projet sur terre de l'État verse automatiquement le co-investissement public au séquestre.

Photos : Unsplash (libres de droits). Cartes : © OpenStreetMap.
