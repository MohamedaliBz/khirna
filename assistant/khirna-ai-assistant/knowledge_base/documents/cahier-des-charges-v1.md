# KHIRNA (خيرنا) · Cahier des charges du prototype (v1.1)

> Rédigé le 22/11/2026 à partir du concept de reil (`agri-share-concept.md`) et de son message sur le modèle à trois parties (agriculteur type 2, État, citoyens).
> Statut : **cadrage à valider**. Aucun développement lancé.
> Nom de marque : **KHIRNA / خيرنا** (confirmé par reil). Contrainte : **4 heures** pour livrer un prototype fonctionnel, entièrement codé par Claude Code. Le périmètre réel est la section 0 ; les sections 1 à 10 restent la vision complète pour le pitch.

---

## 0. Périmètre réel : prototype en 4 heures

### Stack retenue (remplace la §8 pour le hackathon)
| Couche | Choix | Pourquoi |
|---|---|---|
| App | **React + Vite + TypeScript + Tailwind**, en **PWA responsive** | Une seule app : écran ordinateur pour le jury, installable sur téléphone (« Ajouter à l'écran d'accueil ») avec barre de navigation mobile. Aucune compilation Android/iOS à risquer. |
| Données | **Backend simulé dans le navigateur** (store Zustand persistant dans localStorage + jeu de données seed) | Zéro compte cloud à créer, zéro panne réseau pendant la démo. Bouton « Réinitialiser la démo ». |
| Langues | i18n maison **arabe (RTL) + français**, bascule en un clic | Exigé. |
| Carte | Leaflet + OpenStreetMap | Gratuit, sans clé. |
| Médias | Photos libres de droits intégrées + upload local (aperçu) | |
| Démo | `npm run dev` en local, et build statique déployable (Netlify / Vercel / GitHub Pages) pour le QR code mobile | |

Expo, Supabase, signature réelle, notifications push : **hors 4 h** (feuille de route).

### Ce qui est livré (P1 uniquement)
1. Accueil KHIRNA (logo, slogan, chiffres d'impact, « comment ça marche » en 3 étapes).
2. Connexion par **comptes démo en un clic** : Citoyen, Agriculteur type 1, Agriculteur type 2, Agent de l'État, Admin (inscription simple aussi).
3. Catalogue + filtres (activité, gouvernorat, « avec l'État »).
4. Fiche projet : photos, carte, budget, jalons, clé de répartition, risques, badge « Terre de l'État ».
5. Simulateur + investissement simulé (portefeuille fictif, contrat récapitulatif à cocher).
6. Tableau de bord citoyen : investissements, avancement, gains estimés, fil d'actualités, demande de visite.
7. Tableau de bord agriculteur : créer un projet (assistant court), publier une actualité / preuve de jalon, voir les investisseurs, confirmer les visites.
8. Espace État : publier une parcelle, voir les candidatures des agriculteurs type 2, retenir un candidat, co-investir.
9. Agriculteur type 2 : parcelles de l'État disponibles, postuler.
10. Admin : valider / refuser les projets soumis, **valider un jalon → débloquer la tranche** (le rôle vérificateur est fusionné dans l'admin pour la démo).
11. Clôture simulée d'un projet : bouton « déclarer la récolte » → distribution automatique selon la clé, gains crédités.

### Planning des 4 heures
| Temps | Livrable |
|---|---|
| 0:00 – 0:30 | Squelette, design system aux couleurs du logo, i18n ar/fr + RTL, données seed (8 projets, 3 parcelles) |
| 0:30 – 1:30 | Accueil, connexion démo, catalogue, fiche projet, simulateur, investissement |
| 1:30 – 2:30 | Tableaux de bord citoyen et agriculteur, actualités, visites, création de projet |
| 2:30 – 3:15 | Espace État + agriculteur type 2 (parcelles, candidatures), admin (validation, tranches, distribution) |
| 3:15 – 3:45 | Responsive mobile, PWA, finitions, traduction complète |
| 3:45 – 4:00 | Build, déploiement, répétition du scénario de démo |

### Scénario de démo (3 minutes)
Citoyen investit 500 DT dans « 10 vaches laitières à Béja » → voit l'actualité et demande une visite → bascule en Agent de l'État : publie une parcelle à Siliana, retient un agriculteur type 2, co-investit → Admin valide un jalon, la tranche se débloque → clôture d'un projet olive : les gains apparaissent chez le citoyen. Passage en arabe pendant la démo.

---

## 1. Avis honnête sur l'idée

### Ce qui est fort
1. **Un vrai problème des deux côtés.** Des agriculteurs compétents sans capital ni terre, et des citoyens qui ont 300 à 1 000 DT sans placement concret et local. La plateforme fait se rencontrer les deux.
2. **Le volet État est l'idée la plus originale.** Remettre en production des terres domaniales sous-exploitées, sans que l'État cède la propriété, parle directement aux décideurs et aux jurys (emploi des jeunes, souveraineté alimentaire, développement régional).
3. **La transparence comme produit.** Le suivi (photos datées, jalons, dépenses justifiées, visites) est ce qui distingue la plateforme d'une simple cagnotte. C'est le cœur de la démo.
4. **Très démontrable en hackathon.** Un parcours émotionnel simple : « je finance 10 vaches à Béja, je les vois grandir, je reçois ma part ».

### Les risques, sans détour
| Risque | Pourquoi c'est sérieux | Réponse proposée |
|---|---|---|
| **Réglementation du financement participatif** | La Tunisie encadre le crowdfunding (loi n° 2020-37 du 6 août 2020). Collecter de l'argent du public pour des projets suppose une plateforme agréée par l'autorité compétente (CMF pour l'investissement en titres ; le prêt et le don relèvent d'un autre régime). Textes d'application et autorités exactes **à faire confirmer par un juriste**. | Prototype 100 % simulé. Dans le pitch : « nous visons l'agrément de plateforme de financement participatif ». Prévoir l'architecture pour un partenaire agréé (banque, plateforme existante). |
| **Propriété des actifs** | Un citoyen qui « achète 1/20e d'une vache » ne peut pas en être propriétaire en pratique. Qui possède la vache si l'agriculteur part ? | Chaque projet passe par un **contrat type** clair. Trois montages possibles (voir §2). Recommandé : une **structure de projet** (société de projet ou contrat de participation) qui possède les actifs, et des citoyens qui détiennent des **parts de droit aux bénéfices**, pas les animaux eux-mêmes. |
| **Terres domaniales** | L'État ne peut pas « prêter » une terre de manière informelle : il faut une convention (location ou mise à disposition) selon les procédures des Domaines de l'État / Office des Terres Domaniales. | La plateforme **n'attribue rien**. Elle publie les appels de l'État, reçoit les candidatures, et enregistre la convention signée hors plateforme. L'État reste propriétaire, la terre n'est jamais un actif du projet. |
| **Risque agricole** | Mortalité animale, sécheresse, maladie, prix de vente bas. Les citoyens peuvent perdre de l'argent. | Affichage obligatoire du risque, aucun rendement garanti, assurance agricole recommandée (ligne de budget dédiée), score de risque par projet. |
| **Fraude et détournement** | L'agriculteur reçoit l'argent et ne fait pas le projet. | **Fonds sous séquestre** et **déblocage par tranches** liées à des jalons vérifiés (preuve photo géolocalisée + validation d'un vérificateur). C'est l'amélioration la plus importante. |
| **Confiance des citoyens** | Sans historique, personne n'ose investir. | Profils vérifiés, notes après projet, co-investissement de l'État visible comme signal de confiance. |

**Verdict.** L'idée est bonne et défendable devant un jury, à condition de présenter le montage juridique comme une feuille de route et non comme un fait acquis, et de mettre le **séquestre + jalons** au centre. Le prototype doit montrer le parcours complet en simulation, pas la conformité réelle.

---

## 2. Améliorations proposées

1. **Trois modèles de contrat par projet** (l'agriculteur choisit, l'admin valide) :
   - **Participation aux bénéfices** (type moucharaka) : le citoyen apporte X, reçoit un pourcentage du bénéfice net, partage la perte. Modèle par défaut.
   - **Préachat de récolte** : le citoyen paie maintenant une quantité (ex. 20 L d'huile d'olive, 10 kg de fraises) livrée ou revendue à la récolte. Plus simple juridiquement et très parlant pour le grand public. Correspond à « acheter les récoltes ».
   - **Prêt rémunéré** (plus tard) : remboursement à taux fixe. Le plus encadré, hors prototype.
2. **Séquestre et déblocage par tranches.** L'argent collecté reste bloqué. Chaque tranche se débloque quand le jalon précédent est validé (ex. tranche 1 : achat des génisses, preuve = factures + photos ; tranche 2 : alimentation 3 mois).
3. **Nouveau rôle : vérificateur terrain** (agent de la plateforme, ou technicien du CRDA / de la vulgarisation agricole). Il valide les jalons et les visites.
4. **Appel à candidatures sur les terres de l'État.** L'agent public publie une parcelle (lieu, surface, vocation, durée de mise à disposition). Les agriculteurs type 2 proches postulent. Classement automatique indicatif (distance, expérience, plan), décision humaine de l'État.
5. **Co-investissement public visible.** Dans un projet tripartite, la fiche affiche : terre = État (propriétaire), savoir-faire et travail = agriculteur, capital = État + citoyens, avec la clé de répartition.
6. **Clé de répartition paramétrable** : ex. agriculteur 40 %, investisseurs 50 % (dont État), plateforme 5 %, réserve risque 5 %.
7. **Fonds de réserve** prélevé sur chaque projet pour amortir les petites pertes.
8. **Score de risque** simple (type d'activité, expérience, assurance, région, historique), puis IA plus tard.
9. **Journal de bord horodaté et géolocalisé** : les photos prises depuis l'app mobile portent date et position, et ne peuvent pas être importées depuis la galerie pour les jalons.
10. **Diaspora** : tunisiens à l'étranger comme cible prioritaire (montants plus élevés, attachement à la région).

---

## 3. Rôles

| Rôle | Qui | Ce qu'il fait |
|---|---|---|
| **Visiteur** | Non connecté | Voit l'accueil, le catalogue et les fiches projet (sans montants détaillés des investisseurs). |
| **Citoyen investisseur** | Particulier vérifié (CIN) | Investit, suit ses projets, demande des visites, reçoit ses gains. Aucune compétence agricole requise. |
| **Agriculteur type 1** | A une terre (propriété ou location) | Publie un projet sur sa terre, gère budget, jalons, actualités, reçoit les fonds par tranches, déclare ventes et résultats. |
| **Agriculteur type 2** | Savoir-faire, sans terre ni moyens | Postule aux terres de l'État ; une fois retenu, publie un projet tripartite et fait comme le type 1. |
| **Agent public (État)** | Domaines de l'État, CRDA, gouvernorat | Publie des parcelles, examine les candidatures, décide, enregistre la convention, fixe le co-investissement public, suit les projets sur terres domaniales. |
| **Vérificateur terrain** | Technicien plateforme ou partenaire | Visite l'exploitation, valide les jalons et les preuves, accompagne les visites citoyennes. |
| **Admin plateforme** | Équipe | Vérifie les comptes (KYC), valide les projets, gère litiges, paramètres (frais, clés), statistiques. |

Un même compte peut avoir plusieurs rôles (un agriculteur peut aussi investir).

---

## 4. Fonctionnalités par rôle

Priorité prototype : **P1** obligatoire pour la démo, **P2** si le temps le permet, **P3** présenté en maquette ou dans le pitch.

### Citoyen
- P1 Inscription, connexion, choix du profil, vérification simulée (photo CIN).
- P1 Catalogue avec filtres (activité : olives, poulets, vaches, moutons, fraises, maraîchage… ; gouvernorat ; montant minimum ; durée ; type de contrat ; « projets avec l'État »).
- P1 Fiche projet : agriculteur, carte, photos/vidéo, montant recherché et collecté, minimum, durée, budget détaillé, jalons, rendement estimé, risques, clé de répartition, partenaire État.
- P1 Simulateur : « si j'investis 500 DT » → part en %, gain estimé dans 3 scénarios (pessimiste, réaliste, optimiste).
- P1 Investissement simulé (portefeuille fictif rechargeable, confirmation, signature électronique simulée du contrat).
- P1 Tableau de bord : total investi, projets, avancement des jalons, gains estimés et reçus, historique.
- P1 Fil d'actualités du projet (photos datées, étapes, dépenses).
- P1 Demande de visite (créneaux proposés par l'agriculteur, règles sanitaires).
- P2 Notifications (nouveau jalon, tranche débloquée, distribution).
- P2 Favoris, partage du projet.
- P3 Revente de parts entre citoyens, parrainage.

### Agriculteur (type 1 et 2)
- P1 Profil : expérience, diplômes, exploitation, carte de la parcelle.
- P1 Création de projet en assistant (activité → terrain → budget → jalons → objectif de collecte → contrat → photos).
- P1 Budget par lignes (achat animaux, aliments, vétérinaire, semences, irrigation, main-d'œuvre, assurance…).
- P1 Publication d'actualités et de preuves de jalon (photo géolocalisée).
- P1 Tableau de bord : collecte, investisseurs, tranches reçues, jalons, visites demandées.
- P2 Déclaration des ventes et du résultat, calcul automatique de la distribution.
- P2 Gestion des créneaux de visite.
- **Type 2 uniquement** : P1 voir les parcelles de l'État proches, postuler avec un plan simple, suivre sa candidature.

### Agent public (État)
- P1 Publier une parcelle domaniale (carte, surface, vocation, eau, durée, conditions).
- P1 Liste des candidatures avec classement indicatif, décision (retenu / refusé / liste d'attente) avec motif.
- P1 Enregistrer la convention (référence, dates, pièce jointe) et le co-investissement public.
- P2 Tableau de bord : terres mises en valeur, emplois créés, production, montants mobilisés.

### Vérificateur terrain
- P2 Liste des jalons à vérifier, validation ou rejet avec commentaire et photos.
- P2 Planning des visites.

### Admin
- P1 File de validation des projets (valider / demander correction / refuser).
- P1 Vérification des comptes.
- P2 Paramètres : frais, clé de répartition par défaut, réserve.
- P2 Statistiques globales, journal d'audit.

---

## 5. Parcours clés

**A. Citoyen investit (démo principale)**
Accueil → catalogue → filtre « vaches » → fiche projet → simulateur 500 DT → investir → contrat simulé → paiement simulé → tableau de bord → actualité « génisses achetées » avec photo → demande de visite.

**B. Agriculteur type 1 publie**
Inscription → profil → assistant projet → soumission → l'admin valide → projet en collecte → objectif atteint → tranche 1 débloquée → preuve de jalon → validation → tranche 2…

**C. Projet tripartite (agriculteur type 2 + État + citoyens)**
L'agent public publie une parcelle à Siliana → un agriculteur type 2 voisin postule → l'État le retient et enregistre la convention → l'agriculteur crée le projet (terre = État) → l'État co-investit 40 % → les citoyens complètent 60 % → exécution par jalons → récolte → distribution selon la clé. La terre retourne à l'État en fin de convention.

**D. Fin de projet**
Récolte ou vente → l'agriculteur déclare chiffre d'affaires et dépenses avec justificatifs → le vérificateur valide → calcul automatique : bénéfice net × clé → crédit des portefeuilles (simulé) → projet clôturé, notes réciproques.

---

## 6. Statuts

### Projet
```
BROUILLON → SOUMIS → EN_VERIFICATION ─┬→ A_CORRIGER → SOUMIS
                                       └→ REFUSE
                       ↓ validé
                    EN_COLLECTE ─┬→ COLLECTE_ECHOUEE → REMBOURSE
                                 ↓ objectif atteint
                    FINANCE → EN_EXECUTION (jalons + tranches)
                                 ↓
                    RECOLTE_VENTE → DISTRIBUTION → CLOTURE
(à tout moment après validation : SUSPENDU, par l'admin)
```

### Parcelle de l'État
`PUBLIEE → CANDIDATURES_OUVERTES → EN_EXAMEN → ATTRIBUEE (convention) → EN_EXPLOITATION → RESTITUEE`

### Candidature
`ENVOYEE → EN_EXAMEN → RETENUE | REFUSEE | LISTE_ATTENTE`

### Jalon
`A_VENIR → PREUVE_DEPOSEE → VALIDE | REJETE` (une validation débloque la tranche liée)

### Investissement
`EN_ATTENTE_PAIEMENT → CONFIRME → (REMBOURSE si échec) → ACTIF → SOLDE`

### Visite
`DEMANDEE → CONFIRMEE | REFUSEE → EFFECTUEE | ANNULEE`

---

## 7. Modèle de données (simplifié)

```
User(id, email, phone, password_hash, full_name, cin, langue, kyc_status, created_at)
UserRole(user_id, role)                         -- citizen, farmer_t1, farmer_t2, state_agent, verifier, admin
FarmerProfile(user_id, bio, experience_years, specialities[], region, rating)
StateAgency(id, name, type, governorate)         -- Domaines de l'État, CRDA…
StateAgent(user_id, agency_id)

Land(id, owner_type[farmer|state], owner_id, governorate, delegation, area_ha, geom(polygon),
     water_access, soil, photos[])
StateLandOffer(id, land_id, agency_id, vocation[], duration_months, conditions, deadline, status)
LandApplication(id, offer_id, farmer_id, plan_text, distance_km, score, status, decision_reason)
LandConvention(id, offer_id, farmer_id, ref, start_date, end_date, document_url)

Project(id, farmer_id, land_id, convention_id?, activity_type, title, description,
        contract_type[profit_share|harvest_presale|loan], target_amount, min_ticket,
        duration_months, expected_return_low/mid/high, risk_score, status,
        share_farmer_pct, share_investors_pct, share_platform_pct, reserve_pct,
        state_coinvest_amount, published_at, funded_at, closed_at)
BudgetLine(id, project_id, category, label, amount)
Milestone(id, project_id, order, title, due_date, tranche_amount, status)
MilestoneProof(id, milestone_id, media_ids[], lat, lng, taken_at, note)
Verification(id, milestone_id, verifier_id, decision, comment, created_at)

Investment(id, project_id, investor_type[citizen|state], investor_id, amount, share_pct, status, created_at)
Contract(id, investment_id, version, pdf_url, signed_at)
Wallet(id, user_id, balance)                     -- simulé
Transaction(id, wallet_id, type[topup|invest|refund|tranche|distribution|fee], amount, ref_id, created_at)
Escrow(project_id, balance_held, released_total)

Update(id, project_id, author_id, type[news|expense|milestone], text, media_ids[], created_at)
Media(id, url, kind[photo|video|doc], lat, lng, taken_at)
Expense(id, project_id, budget_line_id, amount, receipt_media_id)
SaleReport(id, project_id, revenue, costs, net_profit, proof_media_ids[], validated_by)
Distribution(id, project_id, investment_id, amount, paid_at)

VisitSlot(id, project_id, start_at, capacity)
VisitRequest(id, slot_id, user_id, people_count, status)
Review(id, project_id, author_id, target_id, rating, comment)
Notification(id, user_id, type, payload, read_at)
AuditLog(id, actor_id, action, entity, entity_id, data, created_at)
```

Points clés : la terre de l'État n'est jamais liée à un `Investment` ; l'État apparaît comme investisseur (`investor_type = state`) et comme propriétaire de la `Land`, deux choses distinctes. Le `Contract` matérialise le droit aux bénéfices, séparé de la propriété des actifs (portée par le projet).

---

## 8. Architecture technique du prototype

**Recommandation pour un hackathon (une seule base de code web + mobile) :**

| Couche | Choix | Pourquoi |
|---|---|---|
| App web + mobile | **Expo (React Native) + Expo Router**, export web | Un seul code pour Android, iOS et navigateur. Démo sur téléphone et sur grand écran. |
| UI | NativeWind (Tailwind) | Rapide, cohérent. |
| Langues | i18next, **arabe (RTL) + français** | Public tunisien, jury francophone. |
| Backend | **Supabase** : PostgreSQL + PostGIS, Auth, Storage (photos), Row Level Security par rôle, Edge Functions | Pas de serveur à écrire, sécurité par rôle native, gratuit. |
| Logique métier | Edge Functions : calcul de parts, déblocage de tranche, distribution | Règles financières côté serveur, jamais dans l'app. |
| Carte | Leaflet / OpenStreetMap (web), react-native-maps (mobile) | Gratuit. |
| Paiement | **Portefeuille simulé** (bouton « recharger 1 000 DT ») | Aucune collecte réelle. Interface prête pour un PSP agréé (ex. passerelle bancaire tunisienne) plus tard. |
| Notifications | Expo Notifications | Push mobile. |
| Hébergement | Vercel / Netlify (web), Expo Go ou APK (mobile) | Démo en 1 clic. |

Alternative si l'équipe préfère : Flutter + Firebase, ou Next.js + NestJS + React Native (plus lourd, à éviter en hackathon).

```
[App Expo (web / Android / iOS)]
        │  supabase-js (auth + requêtes filtrées par RLS)
        ▼
[Supabase]
  ├─ Auth (rôles dans UserRole)
  ├─ Postgres + PostGIS (tables §7, politiques RLS par rôle)
  ├─ Storage (photos, vidéos, contrats PDF)
  └─ Edge Functions : invest(), releaseTranche(), distribute(), scoreRisk()
```

**Données de démo** : 8 à 10 projets réalistes (olives à Sfax, vaches à Béja, poulets à Nabeul, fraises à Korba, moutons à Siliana, projet tripartite sur terre domaniale à Kasserine…), 3 comptes prêts à l'emploi (citoyen, agriculteur, agent public) + admin.

---

## 9. Hors prototype (pitch et feuille de route)
Agrément et montage juridique avec un avocat, partenaire bancaire et séquestre réel, signature électronique réelle (Tuntrust), assurance agricole partenaire, suivi satellite (NDVI) des parcelles, IA d'analyse de risque, marketplace des produits, revente de parts, ouverture à la diaspora.

---

## 10. Questions ouvertes (à poser à reil au fil de l'eau)
1. Nom final : KHIRNA / خيرنا ou AGRI SHARE ?
2. Date et durée du hackathon, format de la présentation (démo live, vidéo, jury) ?
3. Taille de l'équipe et compétences (qui code, quelles technos) ?
4. Langues de l'app : arabe + français ? dialecte tunisien dans les textes ?
5. Thème du hackathon (agritech, fintech, smart gov…) et critères du jury ?
6. Un partenaire réel en vue (ministère, CRDA, banque, coopérative) à citer ?
7. Modèle de contrat à mettre en avant : participation aux bénéfices, préachat de récolte, ou les deux ?
8. Frais de la plateforme envisagés (ex. 2 % à la collecte + 5 % du bénéfice) ?
9. Le vérificateur terrain : employé de la plateforme ou technicien de l'État ?
10. Prototype : mobile en priorité, ou web et mobile à égalité ?
