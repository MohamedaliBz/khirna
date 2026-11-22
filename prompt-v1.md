# Prompt v1 · Prototype KHIRNA (à coller dans Claude Code)

> Avant de coller : copier `log.jpeg` (logo KHIRNA) dans le dossier `liltech3.0`. Mettre la synchronisation OneDrive en pause pendant le hackathon (sinon `node_modules` ralentit tout).

---

Tu es un développeur front-end senior et un architecte logiciel. Tu dois construire **en autonomie, de bout en bout**, la première version fonctionnelle de **KHIRNA (خيرنا)**, une plateforme tunisienne d'investissement participatif agricole, pour un hackathon. Le prototype doit être **démontrable devant un jury dans moins de 4 heures**. Travaille dans le dossier courant (Windows, PowerShell). Ne me pose des questions que si tu es réellement bloqué : sinon, prends des décisions raisonnables et avance.

## 1. Le concept
KHIRNA relie trois acteurs autour de projets agricoles :
- **Citoyens investisseurs** sans connaissances agricoles : ils financent une part d'un projet (dès 100 DT), suivent son avancement (photos datées, étapes, dépenses), peuvent demander une visite de l'exploitation et reçoivent une part des bénéfices selon un contrat.
- **Agriculteur type 1** : possède une terre. Il publie un projet (domaine : olives, poulets, vaches, moutons, fraises, maraîchage, apiculture…), son budget détaillé, ses étapes, et prend en charge tout le travail.
- **Agriculteur type 2** : a le savoir-faire mais ni terre ni moyens. L'**État** publie des terres domaniales sous-exploitées. L'agriculteur type 2 proche postule. L'État le retient, met la terre à disposition **temporairement (l'État reste toujours propriétaire)** et **co-investit** dans le projet. Les citoyens complètent le financement : c'est un **projet tripartite État + agriculteur + citoyens**.
- **Admin KHIRNA** : valide les projets, vérifie les étapes et débloque l'argent par tranches.

Principes à rendre visibles dans l'interface :
- **Séquestre et déblocage par tranches** : l'argent collecté reste bloqué ; chaque tranche n'est versée à l'agriculteur qu'après validation de l'étape correspondante (preuve photo).
- **Clé de répartition** du bénéfice net affichée sur chaque projet (ex. agriculteur 40 %, investisseurs 50 %, KHIRNA 5 %, réserve risque 5 %).
- **Aucun rendement garanti** : bandeau de risque sur chaque fiche.
- **Tout est simulé** : aucun paiement réel. Un bandeau discret « Prototype · paiements simulés » est affiché.
- La terre de l'État n'est jamais un actif du projet : badge « Terre de l'État · mise à disposition jusqu'au … ».

## 2. Stack imposée
- **React 18 + Vite + TypeScript + Tailwind CSS**, React Router.
- **Zustand** avec `persist` (localStorage) comme **backend simulé** : toute la logique métier (investir, débloquer une tranche, distribuer) passe par des actions du store, isolées dans `src/services/` pour pouvoir être remplacées plus tard par une vraie API.
- **i18n maison** (contexte React + fichiers `src/i18n/fr.ts` et `src/i18n/ar.ts`) : **arabe et français**, bascule en un clic dans l'en-tête, `dir="rtl"` et `lang="ar"` sur `<html>` en arabe, utiliser les classes logiques Tailwind (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`) pour que la mise en page s'inverse proprement. Police **Cairo** (Google Fonts) pour les deux langues. Aucun texte en dur dans les composants.
- **Leaflet + react-leaflet** avec tuiles OpenStreetMap pour les cartes.
- **vite-plugin-pwa** : manifest (nom KHIRNA, couleur de thème, icônes générées à partir du logo), installable sur téléphone.
- **lucide-react** pour les icônes. Pas d'autre bibliothèque UI lourde.
- Pas de backend, pas de clé d'API, pas de compte cloud.

## 3. Identité visuelle
- Logo : `log.jpeg` à la racine → le copier dans `public/logo.jpeg` et l'utiliser dans l'en-tête, l'accueil et les icônes PWA.
- Slogan (arabe tunisien) : « نستثمروا في أرضنا، ونكبروا بخيرنا » ; en français : « Investissons dans notre terre, grandissons avec ses fruits ».
- Palette : vert profond `#1F5D3A` (primaire), vert olive `#6B8E23`, or blé `#D4A537` (accent), crème `#FAF7EF` (fond), texte `#1C2B22`. Adapter si le logo suggère d'autres teintes.
- Style moderne, chaleureux, cartes arrondies, photos plein cadre, beaucoup d'espace. **Mobile first** : barre de navigation en bas sur mobile, en-tête complet sur ordinateur.

## 4. Rôles et comptes démo
Écran de connexion avec **5 boutons « Entrer en tant que… »** (connexion en un clic) + formulaire d'inscription simple (nom, email, téléphone, rôle). Un sélecteur de rôle dans l'en-tête permet de basculer d'un compte démo à l'autre pendant la démo.

| Compte | Rôle |
|---|---|
| Amine Ben Salah | Citoyen investisseur (portefeuille simulé : 5 000 DT) |
| Hédi Trabelsi | Agriculteur type 1 (Béja, vaches laitières) |
| Salma Gharbi | Agriculteur type 2 (Siliana, sans terre) |
| Ministère des Domaines de l'État – agent régional | Agent de l'État |
| Admin KHIRNA | Administrateur |

## 5. Écrans (tous obligatoires)
1. **Accueil** : héros avec logo, slogan, bouton « Découvrir les projets » ; chiffres d'impact (montant financé, agriculteurs, hectares de terres de l'État remis en culture, citoyens) ; « Comment ça marche » en 3 étapes ; section « Projets avec l'État » ; 3 projets mis en avant.
2. **Connexion / inscription** (cf. §4).
3. **Catalogue** : grille de cartes projet (photo, titre, gouvernorat, domaine, barre de progression de collecte, minimum, durée, rendement estimé, badge État). Filtres : domaine, gouvernorat, type de contrat, « avec l'État », tri.
4. **Fiche projet** : galerie, agriculteur (photo, expérience, note), carte de la parcelle, description, montant recherché / collecté / nombre d'investisseurs, budget détaillé (tableau + barres), étapes avec statut et tranche associée, clé de répartition (graphique en anneau en SVG), partenaire État et co-investissement s'il y a lieu, risques, fil d'actualités, bouton « Investir » et « Demander une visite ».
5. **Simulateur + investissement** : curseur de montant (minimum du projet → montant restant), part en %, gain estimé selon 3 scénarios (pessimiste, réaliste, optimiste) calculés à partir de la clé de répartition ; récapitulatif du contrat (type : participation aux bénéfices ou préachat de récolte) avec case « J'ai compris les risques » ; confirmation → débit du portefeuille, écran de succès animé.
6. **Tableau de bord citoyen** : solde du portefeuille (bouton « Recharger » simulé), total investi, gains reçus, liste de ses investissements avec avancement, fil d'actualités agrégé de ses projets, ses demandes de visite.
7. **Tableau de bord agriculteur** (type 1 et 2) : ses projets et leur statut, collecte, investisseurs, tranches reçues / bloquées ; **assistant de création de projet** en 4 étapes (domaine et titre → terrain et localisation → budget par lignes et étapes avec montant de tranche → objectif, minimum, durée, contrat, clé, photos) puis « Soumettre à validation » ; publier une actualité ou une **preuve d'étape** (texte + photo, horodatage automatique) ; demandes de visite à confirmer ou refuser ; bouton « Déclarer la récolte » (chiffre d'affaires et coûts) sur un projet en cours.
8. **Espace État** : carte et liste des parcelles domaniales ; formulaire « Publier une parcelle » (nom, gouvernorat, surface, vocation, accès à l'eau, durée de mise à disposition, position sur la carte) ; pour chaque parcelle, liste des candidatures des agriculteurs type 2 avec un score indicatif (distance, expérience) ; boutons « Retenir » / « Refuser » ; après attribution, définir le montant du co-investissement public ; tableau d'impact (hectares remis en culture, emplois, montants mobilisés).
9. **Agriculteur type 2 – Terres de l'État** : parcelles ouvertes proches de lui, fiche parcelle, « Postuler » avec un court plan (domaine, expérience, besoin estimé), suivi de ses candidatures. Une fois retenu, il peut créer un projet rattaché à cette parcelle (badge « Terre de l'État »).
10. **Admin** : file des projets soumis (Valider / Demander correction / Refuser avec motif) ; file des **preuves d'étape** à vérifier → « Valider » débloque la tranche (le séquestre diminue, l'agriculteur reçoit la tranche) ; validation des déclarations de récolte → **distribution automatique** du bénéfice net selon la clé, gains crédités dans les portefeuilles ; statistiques globales.
11. **Notifications** : cloche dans l'en-tête avec les événements (investissement reçu, étape validée, tranche débloquée, visite confirmée, gains distribués, candidature retenue).

## 6. Modèle de données (types TypeScript dans `src/types.ts`)
`User`, `Role` (`citizen | farmer_t1 | farmer_t2 | state_agent | admin`), `Land` (propriétaire `farmer | state`), `StateLandOffer`, `LandApplication`, `Project`, `BudgetLine`, `Milestone`, `Investment` (investisseur `citizen | state`), `Wallet`, `Transaction`, `Escrow`, `Update` (actualité / dépense / preuve d'étape), `VisitRequest`, `SaleReport`, `Distribution`, `Notification`.

Statuts :
- Projet : `draft → submitted → (needs_changes) → funding → funded → in_progress → harvest → distributed → closed` (+ `rejected`). Un projet passe en `funded` automatiquement quand la collecte atteint 100 %.
- Parcelle de l'État : `open → reviewing → assigned → in_use`.
- Candidature : `sent → accepted | rejected | waitlist`.
- Étape : `upcoming → proof_submitted → validated | rejected`.
- Visite : `requested → confirmed | refused → done`.

Règles : la somme des parts de la clé = 100 % ; un investissement ne dépasse ni le solde ni le montant restant ; l'argent investi va dans le séquestre du projet ; le bénéfice net = chiffre d'affaires − coûts ; la part investisseurs est répartie au prorata des montants (y compris l'État).

## 7. Données de démo (seed riches et réalistes, en `src/data/seed.ts`)
Au moins 8 projets avec photos libres de droits (URL Unsplash stables), coordonnées GPS réelles, budgets cohérents en DT, étapes et actualités datées :
- 10 vaches laitières – Béja (Hédi, type 1, en collecte à 72 %)
- Oliveraie biologique – Sfax (en cours, 2 étapes validées)
- Poulets de chair 2 000 têtes – Nabeul (financé)
- Fraises sous serre – Korba (en collecte)
- Engraissement d'agneaux – Siliana, **terre de l'État**, Salma (type 2), co-investissement État 40 %
- Maraîchage tomates et piments – Kairouan
- Apiculture – Zaghouan
- Oliveraie – Kasserine, **terre de l'État**, en phase de récolte (prête à être distribuée pendant la démo)

3 parcelles de l'État (Siliana, Kasserine, Le Kef), dont une avec 3 candidatures en attente. Amine a déjà 2 investissements. Bouton **« Réinitialiser la démo »** (dans le menu) qui restaure le seed.

## 8. Scénario de démo à garantir (3 minutes, sans bug)
1. Accueil → catalogue → fiche « 10 vaches laitières – Béja » → simulateur 500 DT → investir → succès ; le tableau de bord d'Amine se met à jour.
2. Demande de visite → bascule sur Hédi → il confirme la visite et publie une preuve d'étape.
3. Bascule sur l'Admin → valide la preuve → tranche débloquée (notification chez Hédi).
4. Bascule sur l'Agent de l'État → publie une parcelle au Kef → retient une candidature → fixe le co-investissement.
5. Admin → valide la récolte de l'oliveraie de Kasserine → distribution → Amine voit ses gains.
6. Passage en arabe à n'importe quel moment : toute l'interface s'inverse correctement.

## 9. Qualité attendue
- Code propre et typé, composants réutilisables (`ProjectCard`, `ProgressBar`, `MilestoneTimeline`, `SplitDonut`, `MapView`, `StatCard`…), dossiers `pages/`, `components/`, `store/`, `services/`, `i18n/`, `data/`.
- Responsive impeccable de 360 px à 1440 px. Format monétaire « 1 250 DT » / « 1 250 د.ت ».
- Aucune erreur dans la console, `npm run build` doit réussir sans erreur TypeScript.
- Un `README.md` en français : présentation, comptes démo, scénario de démo, commandes.

## 10. Méthode
1. Initialise le projet Vite (React + TS) **dans le dossier courant**, installe les dépendances, configure Tailwind, le routeur, la PWA et l'i18n.
2. Construis dans cet ordre : types + seed + store → mise en page (en-tête, navigation mobile, bascule de langue, sélecteur de rôle) → accueil, catalogue, fiche, investissement → tableaux de bord citoyen et agriculteur → État et type 2 → admin, tranches, distribution → notifications → finitions responsive et traductions.
3. Après chaque grande étape, lance `npm run build` et corrige les erreurs avant de continuer.
4. À la fin, déroule toi-même le scénario du §8, corrige ce qui casse, puis donne-moi un récapitulatif et les commandes pour lancer.

## 11. Commandes Windows (PowerShell) à me rappeler à la fin
```powershell
cd "C:\Users\moham\OneDrive\Bureau\liltech3.0"
node -v                      # Node 18 ou plus requis
npm install
npm run dev                  # http://localhost:5173
npm run build
npm run preview -- --host    # ouvrir l'URL "Network" sur un téléphone connecté au même Wi-Fi
```
