// ───────────────────────── Modèle de données KHIRNA ─────────────────────────
// Tout est simulé dans le navigateur. Ces types forment le « contrat » qu'une
// vraie API devra respecter plus tard.

export type Lang = 'fr' | 'ar';

/** Texte bilingue (contenu saisi ou seed). */
export interface L10n {
  fr: string;
  ar: string;
}

export type Role = 'citizen' | 'farmer_t1' | 'farmer_t2' | 'state_agent' | 'admin';

export type Domain =
  | 'olives'
  | 'poultry'
  | 'dairy'
  | 'sheep'
  | 'strawberries'
  | 'vegetables'
  | 'beekeeping'
  | 'fodder'
  | 'dates';

export const DOMAINS: Domain[] = [
  'olives',
  'dairy',
  'poultry',
  'sheep',
  'strawberries',
  'vegetables',
  'beekeeping',
  'fodder',
  'dates',
];

export type Governorate =
  | 'tunis' | 'ariana' | 'ben_arous' | 'manouba' | 'nabeul' | 'zaghouan' | 'bizerte' | 'beja'
  | 'jendouba' | 'kef' | 'siliana' | 'sousse' | 'monastir' | 'mahdia' | 'sfax' | 'kairouan'
  | 'kasserine' | 'sidi_bouzid' | 'gabes' | 'medenine' | 'tataouine' | 'gafsa' | 'tozeur' | 'kebili';

export type LatLng = [number, number];

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  avatar?: string;
  governorate: Governorate;
  location?: LatLng;
  experienceYears?: number;
  rating?: number;
  bio?: L10n;
  /** Comptes affichés sur l'écran de connexion en un clic. */
  demo?: boolean;
  createdAt: string;
}

export type WaterAccess = 'well' | 'irrigation' | 'rain' | 'none';

export interface Land {
  owner: 'farmer' | 'state';
  governorate: Governorate;
  areaHa: number;
  coords: LatLng;
  place: string;
  water: WaterAccess;
  /** Terre de l'État : date de fin de mise à disposition. */
  availableUntil?: string;
  stateOfferId?: string;
}

export type OfferStatus = 'open' | 'reviewing' | 'assigned' | 'in_use';

export interface StateLandOffer {
  id: string;
  name: L10n;
  description: L10n;
  governorate: Governorate;
  areaHa: number;
  vocation: Domain;
  water: WaterAccess;
  durationYears: number;
  coords: LatLng;
  photo: string;
  status: OfferStatus;
  agentId: string;
  publishedAt: string;
  assignedFarmerId?: string;
  /** Montant du co-investissement public engagé (DT). */
  coInvestment?: number;
  projectId?: string;
  jobsEstimate: number;
}

export type ApplicationStatus = 'sent' | 'accepted' | 'rejected' | 'waitlist';

export interface LandApplication {
  id: string;
  offerId: string;
  farmerId: string;
  domain: Domain;
  experienceYears: number;
  plan: string;
  budgetNeeded: number;
  status: ApplicationStatus;
  createdAt: string;
}

export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'needs_changes'
  | 'funding'
  | 'funded'
  | 'in_progress'
  | 'harvest'
  | 'distributed'
  | 'closed'
  | 'rejected';

export type ContractType = 'profit_share' | 'presale';

export interface Split {
  farmer: number;
  investors: number;
  platform: number;
  reserve: number;
}

export interface BudgetLine {
  id: string;
  label: L10n;
  amount: number;
}

export type MilestoneStatus = 'upcoming' | 'proof_submitted' | 'validated' | 'rejected';

export interface Milestone {
  id: string;
  title: L10n;
  tranche: number;
  dueDate: string;
  status: MilestoneStatus;
  proofUpdateId?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Forecast {
  /** Chiffre d'affaires attendu par scénario (DT). */
  pessimistic: number;
  realistic: number;
  optimistic: number;
}

export interface Project {
  id: string;
  title: L10n;
  summary: L10n;
  description: L10n;
  domain: Domain;
  farmerId: string;
  land: Land;
  photos: string[];
  /** Objectif de collecte = total du budget (DT). */
  goal: number;
  minInvestment: number;
  durationMonths: number;
  contractType: ContractType;
  /** Préachat : unité de récolte (ex. « litre d'huile »). */
  presaleUnit?: L10n;
  presaleUnitPrice?: number;
  split: Split;
  forecast: Forecast;
  budget: BudgetLine[];
  milestones: Milestone[];
  riskLevel: RiskLevel;
  risks: L10n[];
  status: ProjectStatus;
  stateOfferId?: string;
  featured?: boolean;
  adminNote?: string;
  jobs: number;
  createdAt: string;
}

export type InvestorType = 'citizen' | 'state';

export interface Investment {
  id: string;
  projectId: string;
  investorId: string;
  investorType: InvestorType;
  amount: number;
  contractType: ContractType;
  date: string;
}

export interface Wallet {
  userId: string;
  balance: number;
}

export type TransactionType = 'topup' | 'investment' | 'tranche' | 'payout';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  projectId?: string;
  date: string;
}

/** Séquestre d'un projet (calculé à partir des investissements et tranches). */
export interface Escrow {
  projectId: string;
  collected: number;
  released: number;
  held: number;
}

export type UpdateKind = 'news' | 'expense' | 'milestone_proof';

export interface Update {
  id: string;
  projectId: string;
  authorId: string;
  kind: UpdateKind;
  text: L10n;
  photo?: string;
  amount?: number;
  milestoneId?: string;
  date: string;
}

export type VisitStatus = 'requested' | 'confirmed' | 'refused' | 'done';

export interface VisitRequest {
  id: string;
  projectId: string;
  citizenId: string;
  wishedDate: string;
  message: string;
  status: VisitStatus;
  createdAt: string;
}

export type SaleReportStatus = 'submitted' | 'validated' | 'rejected';

export interface SaleReport {
  id: string;
  projectId: string;
  revenue: number;
  costs: number;
  note: string;
  status: SaleReportStatus;
  createdAt: string;
}

export interface Payout {
  investorId: string;
  investorType: InvestorType;
  invested: number;
  capital: number;
  gain: number;
}

export interface Distribution {
  id: string;
  projectId: string;
  saleReportId: string;
  revenue: number;
  costs: number;
  net: number;
  farmerAmount: number;
  platformAmount: number;
  reserveAmount: number;
  investorsAmount: number;
  payouts: Payout[];
  date: string;
}

export type NotificationType =
  | 'investment_received'
  | 'project_funded'
  | 'milestone_validated'
  | 'milestone_rejected'
  | 'tranche_released'
  | 'proof_submitted'
  | 'visit_requested'
  | 'visit_confirmed'
  | 'visit_refused'
  | 'payout'
  | 'farmer_payout'
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'application_waitlist'
  | 'project_submitted'
  | 'project_validated'
  | 'project_needs_changes'
  | 'project_rejected'
  | 'harvest_declared'
  | 'coinvest_set';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  params: Record<string, string | number>;
  link?: string;
  read: boolean;
  date: string;
}

/** Base de données simulée (persistée dans localStorage). */
export interface Database {
  users: User[];
  projects: Project[];
  investments: Investment[];
  wallets: Wallet[];
  transactions: Transaction[];
  updates: Update[];
  visits: VisitRequest[];
  offers: StateLandOffer[];
  applications: LandApplication[];
  saleReports: SaleReport[];
  distributions: Distribution[];
  notifications: Notification[];
}
