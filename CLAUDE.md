# KHIRNA (خيرنا) · Contexte du projet

Prototype pour un hackathon : **4 heures** pour livrer une app fonctionnelle. Toute la conception et le code sont faits par Claude Code. L'équipe (5 personnes) parle français ; réponds en français.

## Le produit
Plateforme tunisienne d'investissement participatif agricole. Slogan : « نستثمروا في أرضنا، ونكبروا بخيرنا ».
- **Citoyen investisseur** (aucune compétence agricole) : finance une part d'un projet, suit son avancement (photos datées, étapes, dépenses), demande une visite, reçoit une part des bénéfices.
- **Agriculteur type 1** : a une terre, publie un projet (olives, poulets, vaches, moutons, fraises, maraîchage…), gère tout le travail.
- **Agriculteur type 2** : savoir-faire sans terre ni moyens. Postule aux **terres domaniales** que l'État publie.
- **État (agent public)** : met la terre à disposition temporairement (**il en reste toujours propriétaire**) et co-investit. Projet tripartite État + agriculteur type 2 + citoyens.
- **Admin KHIRNA** : valide les projets, vérifie les étapes, débloque les fonds par tranches, déclenche la distribution.

Principes clés : fonds sous **séquestre**, **déblocage par tranches** après validation d'une étape, **clé de répartition** du bénéfice affichée, aucun rendement garanti, **tout est simulé** (aucun paiement réel).

## Contraintes techniques
- React + Vite + TypeScript + Tailwind, **PWA responsive** (ordinateur + téléphone).
- **Arabe (RTL) + français**, bascule en un clic, aucun texte en dur.
- **Données** : base **Supabase** partagée entre appareils (tables `id + data jsonb`, temps réel, schéma dans `supabase/schema.sql`) quand `.env.local` est rempli ; sinon repli automatique en local (Zustand + localStorage + seed). Le store reste le cache lu par les écrans ; `src/services/sync.ts` synchronise. Paiements toujours simulés.
- Windows / PowerShell. Dossier sous OneDrive.
- Priorité absolue : le **scénario de démo** doit marcher sans bug. `npm run build` doit passer.

## Fichiers de référence (dans ce dossier)
- `prompt-v1.md` : **spécification complète de la v1** (écrans, données, statuts, scénario de démo). C'est la consigne à exécuter.
- `cahier-des-charges-v1.md` : cadrage complet (section 0 = périmètre 4 h ; le reste = vision, risques juridiques, feuille de route).
- `agri-share-concept.md` : concept d'origine écrit par l'équipe (AGRI SHARE est l'ancien nom, le nom final est KHIRNA).
- `log.jpeg` : logo KHIRNA (à copier dans `public/logo.jpeg`).
