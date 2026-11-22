import type {
  BudgetLine,
  ContractType,
  Database,
  Investment,
  L10n,
  Milestone,
  Notification,
  Project,
  Transaction,
  Update,
  User,
} from '../types';
import { AVATARS, PHOTOS } from '../lib/photos';

// ───────────────────────── Helpers ─────────────────────────
const DAY = 86_400_000;
const L = (fr: string, ar: string): L10n => ({ fr, ar });

/** Générateur pseudo-aléatoire déterministe (le seed est identique à chaque réinitialisation). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_IDS = {
  citizen: 'u-amine',
  farmer_t1: 'u-hedi',
  farmer_t2: 'u-salma',
  state_agent: 'u-state',
  admin: 'u-admin',
} as const;

export function createSeed(): Database {
  const now = Date.now();
  const ago = (d: number) => new Date(now - d * DAY).toISOString();
  const inDays = (d: number) => new Date(now + d * DAY).toISOString();

  // ───────────────────────── Utilisateurs ─────────────────────────
  const users: User[] = [
    {
      id: 'u-amine', name: 'Amine Ben Salah', role: 'citizen', email: 'amine.bensalah@example.tn', phone: '+216 22 145 870',
      avatar: AVATARS.m4, governorate: 'tunis', location: [36.8065, 10.1815], demo: true, createdAt: ago(260),
      bio: L('Ingénieur informatique à Tunis, investit dans l’agriculture locale.', 'مهندس إعلامية في تونس، يستثمر في الفلاحة المحلية.'),
    },
    {
      id: 'u-hedi', name: 'Hédi Trabelsi', role: 'farmer_t1', email: 'hedi.trabelsi@example.tn', phone: '+216 98 330 412',
      avatar: AVATARS.m3, governorate: 'beja', location: [36.76, 9.17], experienceYears: 15, rating: 4.8, demo: true, createdAt: ago(300),
      bio: L('Éleveur laitier depuis 15 ans à Béja, fils et petit-fils d’agriculteurs. Livre sa production à la centrale laitière régionale.', 'مربي أبقار حلوب منذ 15 سنة في باجة، ابن وحفيد فلاحين. يزوّد مركز تجميع الحليب الجهوي.'),
    },
    {
      id: 'u-salma', name: 'Salma Gharbi', role: 'farmer_t2', email: 'salma.gharbi@example.tn', phone: '+216 55 210 963',
      avatar: AVATARS.f1, governorate: 'siliana', location: [36.0849, 9.3708], experienceYears: 9, rating: 4.6, demo: true, createdAt: ago(200),
      bio: L('Technicienne en production animale, 9 ans de bergerie chez des éleveurs de Siliana. Sans terre ni capital, jusqu’à KHIRNA.', 'تقنية في الإنتاج الحيواني، 9 سنوات في تربية الأغنام عند مربين في سليانة. بلا أرض ولا رأس مال، حتى خيرنا.'),
    },
    {
      id: 'u-state', name: 'Ministère des Domaines de l’État – agent régional', role: 'state_agent', email: 'agent.regional@domaines.gov.tn',
      phone: '+216 71 000 000', governorate: 'kef', demo: true, createdAt: ago(500),
    },
    {
      id: 'u-admin', name: 'Admin KHIRNA', role: 'admin', email: 'admin@khirna.tn', phone: '+216 70 000 000', governorate: 'tunis', demo: true, createdAt: ago(500),
    },
    { id: 'u-mounir', name: 'Mounir Jelassi', role: 'farmer_t1', email: 'mounir@example.tn', phone: '+216 97 112 334', avatar: AVATARS.m1, governorate: 'sfax', location: [34.74, 10.52], experienceYears: 22, rating: 4.9, createdAt: ago(400),
      bio: L('Oléiculteur à Agareb, converti au bio en 2019. Certifié Ecocert.', 'فلاح زيتون في عقارب، تحوّل إلى الفلاحة البيولوجية سنة 2019.') },
    { id: 'u-rania', name: 'Rania Ben Amor', role: 'farmer_t1', email: 'rania@example.tn', phone: '+216 94 551 220', avatar: AVATARS.f2, governorate: 'nabeul', location: [36.53, 10.55], experienceYears: 8, rating: 4.7, createdAt: ago(250),
      bio: L('Vétérinaire de formation, élève des poulets de chair en bande unique depuis 8 ans.', 'طبيبة بيطرية، تربي دجاج اللحم منذ 8 سنوات.') },
    { id: 'u-karim', name: 'Karim Mansour', role: 'farmer_t1', email: 'karim@example.tn', phone: '+216 92 640 118', avatar: AVATARS.m2, governorate: 'nabeul', location: [36.578, 10.858], experienceYears: 11, rating: 4.5, createdAt: ago(240),
      bio: L('Producteur de fraises à Korba, fournit les marchés de Tunis et de Nabeul.', 'منتج فراولة في قربة، يزوّد أسواق تونس ونابل.') },
    { id: 'u-mohamed', name: 'Mohamed Ayari', role: 'farmer_t1', email: 'mohamed@example.tn', phone: '+216 93 870 551', avatar: AVATARS.m1, governorate: 'kairouan', location: [35.62, 9.93], experienceYears: 14, rating: 4.4, createdAt: ago(230),
      bio: L('Maraîcher à Chebika, spécialiste de la tomate de saison et du piment.', 'فلاح خضروات في الشبيكة، مختص في الطماطم والفلفل.') },
    { id: 'u-nour', name: 'Nour Hammami', role: 'farmer_t1', email: 'nour@example.tn', phone: '+216 96 205 774', avatar: AVATARS.f3, governorate: 'zaghouan', location: [36.37, 10.1], experienceYears: 6, rating: 4.8, createdAt: ago(210),
      bio: L('Apicultrice, produit un miel de romarin et de thym du djebel Zaghouan.', 'مربية نحل، تنتج عسل الإكليل والزعتر من جبل زغوان.') },
    { id: 'u-youssef', name: 'Youssef Brahmi', role: 'farmer_t2', email: 'youssef@example.tn', phone: '+216 98 774 120', governorate: 'kasserine', location: [35.35, 8.62], experienceYears: 12, rating: 4.7, createdAt: ago(450),
      bio: L('Ouvrier oléicole pendant 12 ans, il exploite depuis 2025 une terre domaniale à Foussana.', 'عامل في الزياتين لمدة 12 سنة، يستغل منذ 2025 أرضًا دولية في فوسانة.') },
    { id: 'u-ali', name: 'Ali Ben Youssef', role: 'farmer_t1', email: 'ali@example.tn', phone: '+216 95 330 662', governorate: 'kebili', location: [33.46, 9.02], experienceYears: 18, rating: 4.6, createdAt: ago(40),
      bio: L('Phoéniciculteur à Douz, 150 palmiers Deglet Nour hérités de son père.', 'فلاح نخيل في دوز، 150 نخلة دقلة نور ورثها عن والده.') },
    { id: 'u-anis', name: 'Anis Khelifi', role: 'farmer_t2', email: 'anis@example.tn', phone: '+216 50 118 447', governorate: 'kef', location: [36.2, 8.72], experienceYears: 5, rating: 4.3, createdAt: ago(60) },
    { id: 'u-ines', name: 'Ines Mejri', role: 'farmer_t2', email: 'ines@example.tn', phone: '+216 52 904 331', governorate: 'jendouba', location: [36.5, 8.78], experienceYears: 10, rating: 4.7, createdAt: ago(80) },
  ];

  // Citoyens investisseurs générés (pour des collectes réalistes).
  const FIRST = ['Sarra', 'Walid', 'Leila', 'Omar', 'Nesrine', 'Bilel', 'Mariem', 'Yassine', 'Rim', 'Hamza', 'Amel', 'Fares', 'Ons', 'Skander', 'Hiba', 'Aziz', 'Emna', 'Mehdi', 'Asma', 'Ghassen', 'Yosra', 'Chokri', 'Dorra', 'Khaled', 'Imen', 'Seif', 'Wafa', 'Nizar', 'Sonia', 'Tarek'];
  const LAST = ['Ben Ali', 'Chaabane', 'Bouazizi', 'Dridi', 'Ferchichi', 'Jaziri', 'Saidi', 'Haddad', 'Mabrouk', 'Toumi', 'Karoui', 'Zouari', 'Masmoudi', 'Gharsalli', 'Hamdi'];
  const citizenPool: string[] = [];
  FIRST.forEach((f, i) => {
    const id = `u-c${String(i + 1).padStart(2, '0')}`;
    citizenPool.push(id);
    users.push({
      id, name: `${f} ${LAST[i % LAST.length]}`, role: 'citizen', email: `${f.toLowerCase()}@example.tn`, phone: '+216 20 000 000',
      governorate: (['tunis', 'ariana', 'sousse', 'sfax', 'ben_arous', 'nabeul'] as const)[i % 6], createdAt: ago(300 - i * 5),
    });
  });

  // ───────────────────────── Projets ─────────────────────────
  const b = (id: string, fr: string, ar: string, amount: number): BudgetLine => ({ id, label: L(fr, ar), amount });
  const m = (id: string, fr: string, ar: string, tranche: number, due: string, status: Milestone['status'] = 'upcoming', validatedAt?: string): Milestone => ({
    id, title: L(fr, ar), tranche, dueDate: due, status, validatedAt,
  });

  const RISK_DRY = L('Sécheresse et disponibilité de l’eau', 'الجفاف وتوفر الماء');
  const RISK_PRICE = L('Baisse des prix de vente au moment de la récolte', 'انخفاض أسعار البيع عند الصابة');
  const RISK_HEALTH = L('Maladie ou mortalité animale (assurance prévue au budget)', 'مرض أو نفوق الحيوانات (تأمين مبرمج في الميزانية)');
  const RISK_CLIMATE = L('Aléas climatiques : grêle, gel, vent chaud', 'التقلبات المناخية: برد، جليد، رياح حارة');

  const projects: Project[] = [
    {
      id: 'p-beja-cows', farmerId: 'u-hedi', domain: 'dairy', status: 'funding', featured: true,
      title: L('10 vaches laitières – Béja', '10 أبقار حلوب – باجة'),
      summary: L('Agrandir un élevage familial avec 10 génisses Holstein gestantes et une salle de traite moderne.', 'توسيع ضيعة عائلية بـ10 عجلات هولشتاين حوامل وقاعة حلب عصرية.'),
      description: L(
        'Hédi élève déjà 12 vaches sur ses 6 hectares près de Béja. Ce projet finance l’achat de 10 génisses Holstein gestantes, l’aménagement de l’étable et une petite salle de traite avec cuve de refroidissement. Le lait est livré chaque jour au centre de collecte régional, à 4 km. Le fourrage provient en partie de son projet de luzerne déjà financé sur KHIRNA.',
        'يربي الهادي حاليًا 12 بقرة على 6 هكتارات قرب باجة. يموّل هذا المشروع شراء 10 عجلات هولشتاين حوامل، وتهيئة الإسطبل وقاعة حلب صغيرة مع خزان تبريد. يُسلَّم الحليب يوميًا إلى مركز التجميع الجهوي على بعد 4 كم. جزء من الأعلاف يأتي من مشروع الفصة الممول سابقًا على خيرنا.',
      ),
      land: { owner: 'farmer', governorate: 'beja', areaHa: 6, coords: [36.758, 9.165], place: 'Béja Nord', water: 'well' },
      photos: [PHOTOS.cows[0], PHOTOS.cows[1], PHOTOS.cows[3], PHOTOS.cows[2]],
      goal: 60000, minInvestment: 100, durationMonths: 24, contractType: 'profit_share',
      split: { farmer: 40, investors: 50, platform: 5, reserve: 5 },
      forecast: { pessimistic: 62000, realistic: 78000, optimistic: 88000 },
      budget: [
        b('b1', 'Achat de 10 génisses Holstein gestantes', 'شراء 10 عجلات هولشتاين حوامل', 38000),
        b('b2', 'Aménagement de l’étable et salle de traite', 'تهيئة الإسطبل وقاعة الحلب', 9000),
        b('b3', 'Aliments et fourrage (6 mois)', 'أعلاف وعلف (6 أشهر)', 8500),
        b('b4', 'Suivi vétérinaire et assurance du cheptel', 'متابعة بيطرية وتأمين القطيع', 3000),
        b('b5', 'Matériel de traite et cuve de refroidissement', 'معدات الحلب وخزان التبريد', 1500),
      ],
      milestones: [
        m('m1', 'Achat et livraison des 10 génisses', 'شراء وتسليم 10 عجلات', 30000, inDays(30)),
        m('m2', 'Étable et salle de traite opérationnelles', 'الإسطبل وقاعة الحلب جاهزة', 12000, inDays(75)),
        m('m3', 'Alimentation et suivi des 6 premiers mois', 'التغذية والمتابعة خلال الأشهر الستة الأولى', 10000, inDays(200)),
        m('m4', 'Première lactation et livraison du lait', 'أول إدرار وتسليم الحليب', 8000, inDays(320)),
      ],
      riskLevel: 'medium', risks: [RISK_HEALTH, RISK_PRICE, RISK_DRY], jobs: 2, createdAt: ago(35),
    },
    {
      id: 'p-sfax-olive', farmerId: 'u-mounir', domain: 'olives', status: 'in_progress', featured: true,
      title: L('Oliveraie biologique – Sfax', 'زياتين بيولوجية – صفاقس'),
      summary: L('Remettre en pleine production 800 oliviers Chemlali certifiés bio, avec irrigation au goutte-à-goutte.', 'إعادة 800 زيتونة شملالي بيولوجية إلى الإنتاج الكامل مع الري قطرة قطرة.'),
      description: L(
        'À Agareb, Mounir conduit 800 oliviers Chemlali en agriculture biologique. Le projet finance la taille de régénération, un réseau de goutte-à-goutte alimenté par le puits, la fertilisation biologique et la certification, puis la récolte et la trituration. L’huile extra vierge bio est vendue à un exportateur sfaxien.',
        'في عقارب، يستغل منير 800 زيتونة شملالي في الفلاحة البيولوجية. يموّل المشروع التقليم، وشبكة ري قطرة قطرة من البئر، والتسميد البيولوجي والإشهاد، ثم الجني والعصر. يُباع زيت الزيتون البكر الممتاز البيولوجي لمصدّر صفاقسي.',
      ),
      land: { owner: 'farmer', governorate: 'sfax', areaHa: 12, coords: [34.742, 10.528], place: 'Agareb', water: 'well' },
      photos: [PHOTOS.olives[0], PHOTOS.olives[1], PHOTOS.olives[2], PHOTOS.olives[3]],
      goal: 48000, minInvestment: 100, durationMonths: 18, contractType: 'profit_share',
      split: { farmer: 45, investors: 45, platform: 5, reserve: 5 },
      forecast: { pessimistic: 50000, realistic: 60000, optimistic: 68000 },
      budget: [
        b('b1', 'Taille de régénération de 800 oliviers', 'تقليم 800 زيتونة', 9000),
        b('b2', 'Réseau goutte-à-goutte depuis le puits', 'شبكة ري قطرة قطرة من البئر', 16000),
        b('b3', 'Fertilisation biologique et certification', 'تسميد بيولوجي وإشهاد', 8000),
        b('b4', 'Main-d’œuvre de récolte', 'يد عاملة للجني', 10000),
        b('b5', 'Trituration et mise en bouteille', 'العصر والتعبئة', 5000),
      ],
      milestones: [
        m('m1', 'Taille et nettoyage de l’oliveraie', 'تقليم وتنظيف الزياتين', 9000, ago(150), 'validated', ago(148)),
        m('m2', 'Irrigation goutte-à-goutte installée', 'تركيز الري قطرة قطرة', 16000, ago(90), 'validated', ago(88)),
        m('m3', 'Fertilisation bio et audit de certification', 'تسميد بيولوجي وتدقيق الإشهاد', 8000, ago(5), 'proof_submitted'),
        m('m4', 'Récolte et trituration', 'الجني والعصر', 15000, inDays(40)),
      ],
      riskLevel: 'low', risks: [RISK_DRY, RISK_PRICE], jobs: 6, createdAt: ago(230),
    },
    {
      id: 'p-nabeul-chicken', farmerId: 'u-rania', domain: 'poultry', status: 'funded',
      title: L('Poulets de chair : 2 000 têtes – Nabeul', 'دجاج لحم: 2000 رأس – نابل'),
      summary: L('Une bande de 2 000 poulets de chair dans un poulailler rénové et ventilé.', 'دفعة من 2000 دجاجة لحم في مدجنة مجددة ومهوّاة.'),
      description: L(
        'Rania, vétérinaire, rénove son poulailler de Bou Argoub (ventilation, isolation, abreuvoirs automatiques) pour élever une bande de 2 000 poulets de chair en 45 jours, vendus à un abattoir agréé de Nabeul. Le projet couvre un cycle complet.',
        'تجدد رانية، الطبيبة البيطرية، مدجنتها في بوعرقوب (تهوئة، عزل، مشارب آلية) لتربية دفعة من 2000 دجاجة لحم في 45 يومًا، تُباع لمسلخ مصادق عليه في نابل. يغطي المشروع دورة كاملة.',
      ),
      land: { owner: 'farmer', governorate: 'nabeul', areaHa: 0.5, coords: [36.53, 10.55], place: 'Bou Argoub', water: 'well' },
      photos: [PHOTOS.chickens[0], PHOTOS.chickens[1]],
      goal: 36000, minInvestment: 100, durationMonths: 6, contractType: 'profit_share',
      split: { farmer: 40, investors: 50, platform: 5, reserve: 5 },
      forecast: { pessimistic: 37000, realistic: 44000, optimistic: 48000 },
      budget: [
        b('b1', 'Rénovation du poulailler et ventilation', 'تجديد المدجنة والتهوئة', 8000),
        b('b2', 'Poussins d’un jour (2 000)', 'فلالس عمر يوم (2000)', 4000),
        b('b3', 'Aliment complet', 'علف مركّب', 18000),
        b('b4', 'Vaccins et suivi vétérinaire', 'تلاقيح ومتابعة بيطرية', 2500),
        b('b5', 'Chauffage et litière', 'تدفئة وفرشة', 3500),
      ],
      milestones: [
        m('m1', 'Poulailler rénové et ventilé', 'مدجنة مجددة ومهوّاة', 10000, inDays(15)),
        m('m2', 'Mise en place des 2 000 poussins', 'وضع 2000 فلوس', 12000, inDays(25)),
        m('m3', 'Engraissement (45 jours)', 'التسمين (45 يومًا)', 10000, inDays(70)),
        m('m4', 'Abattage et vente', 'الذبح والبيع', 4000, inDays(80)),
      ],
      riskLevel: 'medium', risks: [RISK_HEALTH, RISK_PRICE], jobs: 2, createdAt: ago(60),
    },
    {
      id: 'p-korba-straw', farmerId: 'u-karim', domain: 'strawberries', status: 'funding', featured: true,
      title: L('Fraises sous serre – Korba', 'فراولة في البيوت المحمية – قربة'),
      summary: L('Deux serres tunnel de fraises en fertirrigation, récolte de février à mai.', 'بيتان محميان للفراولة بالري المسمّد، الجني من فيفري إلى ماي.'),
      description: L(
        'Karim installe deux serres tunnel sur un hectare irrigué à Korba et plante 30 000 plants de fraisiers. Les investisseurs préachètent des kilos de fraises : à la récolte, ils peuvent être livrés ou laisser Karim les vendre pour eux sur le marché de gros de Bir El Kassaa.',
        'يركّز كريم بيتين محميين على هكتار سقوي في قربة ويغرس 30000 شتلة فراولة. المستثمرون يشترون مسبقًا كيلوغرامات من الفراولة: عند الجني، يمكن تسليمها أو ترك كريم يبيعها لحسابهم في سوق الجملة ببئر القصعة.',
      ),
      land: { owner: 'farmer', governorate: 'nabeul', areaHa: 1, coords: [36.578, 10.858], place: 'Korba', water: 'irrigation' },
      photos: [PHOTOS.strawberries[0], PHOTOS.strawberries[1], PHOTOS.strawberries[2], PHOTOS.strawberries[3]],
      goal: 40000, minInvestment: 100, durationMonths: 8, contractType: 'presale',
      presaleUnit: L('kg de fraises', 'كغ فراولة'), presaleUnitPrice: 6,
      split: { farmer: 40, investors: 50, platform: 5, reserve: 5 },
      forecast: { pessimistic: 40000, realistic: 52000, optimistic: 58000 },
      budget: [
        b('b1', 'Deux serres tunnel', 'بيتان محميان', 16000),
        b('b2', 'Plants de fraisiers (30 000)', 'شتلات فراولة (30000)', 9000),
        b('b3', 'Goutte-à-goutte et fertirrigation', 'ري قطرة قطرة وتسميد', 7000),
        b('b4', 'Main-d’œuvre de cueillette', 'يد عاملة للجني', 5000),
        b('b5', 'Emballage et transport', 'تعليب ونقل', 3000),
      ],
      milestones: [
        m('m1', 'Installation des serres', 'تركيز البيوت المحمية', 16000, inDays(20)),
        m('m2', 'Plantation des 30 000 plants', 'غراسة 30000 شتلة', 12000, inDays(35)),
        m('m3', 'Fertirrigation et entretien', 'الري المسمّد والعناية', 7000, inDays(110)),
        m('m4', 'Cueillette et vente', 'الجني والبيع', 5000, inDays(200)),
      ],
      riskLevel: 'medium', risks: [RISK_CLIMATE, RISK_PRICE], jobs: 5, createdAt: ago(20),
    },
    {
      id: 'p-siliana-lambs', farmerId: 'u-salma', domain: 'sheep', status: 'funding', featured: true, stateOfferId: 'o-siliana',
      title: L('Engraissement d’agneaux – Siliana', 'تسمين الخرفان – سليانة'),
      summary: L('Projet tripartite : 200 agneaux engraissés sur une terre de l’État, co-financés par l’État et les citoyens.', 'مشروع ثلاثي: تسمين 200 خروف على أرض دولية، بتمويل مشترك من الدولة والمواطنين.'),
      description: L(
        'Salma a le savoir-faire mais ni terre ni capital. Retenue par les Domaines de l’État sur le lot 2 de Siliana Sud (8 ha, puits), elle réhabilite la bergerie et engraisse 200 agneaux de race Barbarine pour l’Aïd. L’État met la terre à disposition pour 5 ans (il en reste propriétaire) et apporte 40 % du financement ; les citoyens complètent.',
        'سلمى عندها الخبرة لكن بلا أرض ولا رأس مال. تم قبولها من طرف أملاك الدولة على القسط 2 بسليانة الجنوبية (8 هك، بئر)، فتعيد تهيئة الحظيرة وتسمّن 200 خروف من سلالة البربرين للعيد. الدولة تضع الأرض على الذمة لمدة 5 سنوات (وتبقى مالكتها) وتساهم بـ40٪ من التمويل؛ والمواطنون يكمّلون.',
      ),
      land: { owner: 'state', governorate: 'siliana', areaHa: 8, coords: [36.05, 9.35], place: 'Siliana Sud – lot 2', water: 'well', availableUntil: inDays(5 * 365), stateOfferId: 'o-siliana' },
      photos: [PHOTOS.sheep[0], PHOTOS.sheep[1], PHOTOS.sheep[2], PHOTOS.lands[2]],
      goal: 50000, minInvestment: 100, durationMonths: 10, contractType: 'profit_share',
      split: { farmer: 40, investors: 50, platform: 5, reserve: 5 },
      forecast: { pessimistic: 50000, realistic: 62000, optimistic: 68000 },
      budget: [
        b('b1', 'Achat de 200 agneaux Barbarine', 'شراء 200 خروف بربرين', 26000),
        b('b2', 'Aliment : orge, foin, concentré', 'أعلاف: شعير، تبن، مركّز', 14000),
        b('b3', 'Réhabilitation de la bergerie', 'إعادة تهيئة الحظيرة', 6000),
        b('b4', 'Suivi vétérinaire', 'متابعة بيطرية', 2000),
        b('b5', 'Transport et vente', 'نقل وبيع', 2000),
      ],
      milestones: [
        m('m1', 'Bergerie réhabilitée', 'حظيرة مهيأة', 6000, inDays(25)),
        m('m2', 'Achat des 200 agneaux', 'شراء 200 خروف', 26000, inDays(40)),
        m('m3', 'Engraissement (5 mois)', 'التسمين (5 أشهر)', 14000, inDays(190)),
        m('m4', 'Vente avant l’Aïd', 'البيع قبل العيد', 4000, inDays(240)),
      ],
      riskLevel: 'medium', risks: [RISK_HEALTH, RISK_PRICE, RISK_DRY], jobs: 3, createdAt: ago(28),
    },
    {
      id: 'p-kairouan-veg', farmerId: 'u-mohamed', domain: 'vegetables', status: 'funding',
      title: L('Maraîchage tomates et piments – Kairouan', 'خضروات طماطم وفلفل – القيروان'),
      summary: L('3 hectares de tomates de saison et de piments en irrigué, vendus au marché de gros.', '3 هكتارات من الطماطم الفصلية والفلفل السقوي، تُباع في سوق الجملة.'),
      description: L(
        'À Chebika, Mohamed cultive 3 hectares irrigués. Le projet finance les plants, le goutte-à-goutte, les intrants et la main-d’œuvre d’une saison de tomates et de piments, vendus au marché de gros de Kairouan et à une conserverie locale.',
        'في الشبيكة، يزرع محمد 3 هكتارات سقوية. يموّل المشروع الشتلات والري قطرة قطرة والمستلزمات واليد العاملة لموسم طماطم وفلفل، تُباع في سوق الجملة بالقيروان ولمصنع تعليب محلي.',
      ),
      land: { owner: 'farmer', governorate: 'kairouan', areaHa: 3, coords: [35.62, 9.93], place: 'Chebika', water: 'irrigation' },
      photos: [PHOTOS.vegetables[0], PHOTOS.vegetables[1], PHOTOS.vegetables[2], PHOTOS.vegetables[3]],
      goal: 28000, minInvestment: 100, durationMonths: 7, contractType: 'profit_share',
      split: { farmer: 45, investors: 45, platform: 5, reserve: 5 },
      forecast: { pessimistic: 27000, realistic: 36000, optimistic: 41000 },
      budget: [
        b('b1', 'Plants de tomates et piments', 'شتلات طماطم وفلفل', 4000),
        b('b2', 'Goutte-à-goutte', 'ري قطرة قطرة', 7000),
        b('b3', 'Engrais et traitements', 'أسمدة ومداواة', 5500),
        b('b4', 'Main-d’œuvre', 'يد عاملة', 8000),
        b('b5', 'Transport vers le marché', 'نقل إلى السوق', 3500),
      ],
      milestones: [
        m('m1', 'Préparation du sol et irrigation', 'تحضير التربة والري', 9000, inDays(30)),
        m('m2', 'Plantation', 'الغراسة', 6000, inDays(45)),
        m('m3', 'Entretien et traitements', 'العناية والمداواة', 8000, inDays(120)),
        m('m4', 'Récolte et vente', 'الجني والبيع', 5000, inDays(190)),
      ],
      riskLevel: 'high', risks: [RISK_PRICE, RISK_CLIMATE, RISK_DRY], jobs: 4, createdAt: ago(15),
    },
    {
      id: 'p-zaghouan-bees', farmerId: 'u-nour', domain: 'beekeeping', status: 'funding',
      title: L('Apiculture : 60 ruches – Zaghouan', 'تربية النحل: 60 خلية – زغوان'),
      summary: L('60 ruches en transhumance sur le romarin et le thym du djebel Zaghouan.', '60 خلية في الترحال على الإكليل والزعتر في جبل زغوان.'),
      description: L(
        'Nour passe de 25 à 85 ruches. Les investisseurs préachètent des kilos de miel de romarin : livrés en pots étiquetés à la récolte, ou revendus pour eux auprès des épiceries fines de Tunis.',
        'تنتقل نور من 25 إلى 85 خلية. المستثمرون يشترون مسبقًا كيلوغرامات من عسل الإكليل: تُسلَّم في برطمانات عند الجني أو تُباع لحسابهم لدى محلات تونس.',
      ),
      land: { owner: 'farmer', governorate: 'zaghouan', areaHa: 2, coords: [36.37, 10.1], place: 'Djebel Zaghouan', water: 'none' },
      photos: [PHOTOS.bees[0], PHOTOS.bees[1], PHOTOS.bees[2], PHOTOS.bees[3]],
      goal: 18000, minInvestment: 100, durationMonths: 12, contractType: 'presale',
      presaleUnit: L('kg de miel', 'كغ عسل'), presaleUnitPrice: 45,
      split: { farmer: 40, investors: 50, platform: 5, reserve: 5 },
      forecast: { pessimistic: 18000, realistic: 24000, optimistic: 27000 },
      budget: [
        b('b1', '60 ruches peuplées', '60 خلية مأهولة', 10800),
        b('b2', 'Extracteur, combinaisons, enfumoirs', 'آلة استخراج، بدلات، مدخنات', 3200),
        b('b3', 'Transhumance', 'الترحال', 1500),
        b('b4', 'Traitements contre le varroa', 'مداواة ضد الفاروا', 1000),
        b('b5', 'Pots et étiquetage', 'برطمانات وملصقات', 1500),
      ],
      milestones: [
        m('m1', 'Achat des 60 ruches', 'شراء 60 خلية', 10800, inDays(20)),
        m('m2', 'Matériel de miellerie', 'معدات العسل', 3200, inDays(40)),
        m('m3', 'Transhumance de printemps', 'ترحال الربيع', 2500, inDays(150)),
        m('m4', 'Récolte et mise en pots', 'الجني والتعبئة', 1500, inDays(240)),
      ],
      riskLevel: 'low', risks: [RISK_CLIMATE, L('Mortalité des colonies (varroa)', 'نفوق الطوائف (الفاروا)')], jobs: 2, createdAt: ago(25),
    },
    {
      id: 'p-kasserine-olive', farmerId: 'u-youssef', domain: 'olives', status: 'harvest', stateOfferId: 'o-kasserine',
      title: L('Oliveraie de 1 200 oliviers – Kasserine', 'زياتين 1200 شجرة – القصرين'),
      summary: L('Une oliveraie domaniale abandonnée remise en production par un agriculteur sans terre, avec l’État et les citoyens.', 'زياتين دولية مهملة أعيدت إلى الإنتاج من طرف فلاح بلا أرض، مع الدولة والمواطنين.'),
      description: L(
        'À Foussana, 1 200 oliviers domaniaux n’étaient plus entretenus depuis dix ans. Youssef, ouvrier oléicole sans terre, a été retenu par les Domaines de l’État. Taille sévère, irrigation complémentaire et fertilisation ont permis une première vraie récolte : 62 tonnes d’olives.',
        'في فوسانة، لم تُعتنَ 1200 زيتونة دولية منذ عشر سنوات. تم قبول يوسف، العامل في الزياتين بلا أرض، من طرف أملاك الدولة. التقليم الصارم والري التكميلي والتسميد مكّنت من أول صابة حقيقية: 62 طنًا من الزيتون.',
      ),
      land: { owner: 'state', governorate: 'kasserine', areaHa: 15, coords: [35.35, 8.62], place: 'Foussana – lot 7', water: 'rain', availableUntil: inDays(6 * 365), stateOfferId: 'o-kasserine' },
      photos: [PHOTOS.olives[1], PHOTOS.olives[0], PHOTOS.olives[2], PHOTOS.lands[4]],
      goal: 40000, minInvestment: 100, durationMonths: 14, contractType: 'profit_share',
      split: { farmer: 40, investors: 50, platform: 5, reserve: 5 },
      forecast: { pessimistic: 44000, realistic: 56000, optimistic: 62000 },
      budget: [
        b('b1', 'Taille sévère de régénération', 'تقليم تجديد صارم', 12000),
        b('b2', 'Irrigation complémentaire', 'ري تكميلي', 10000),
        b('b3', 'Fertilisation', 'تسميد', 6000),
        b('b4', 'Récolte', 'الجني', 8000),
        b('b5', 'Trituration', 'العصر', 4000),
      ],
      milestones: [
        m('m1', 'Taille de régénération', 'تقليم التجديد', 12000, ago(300), 'validated', ago(298)),
        m('m2', 'Irrigation complémentaire', 'الري التكميلي', 10000, ago(220), 'validated', ago(218)),
        m('m3', 'Fertilisation et entretien', 'التسميد والعناية', 10000, ago(120), 'validated', ago(118)),
        m('m4', 'Récolte et trituration', 'الجني والعصر', 8000, ago(30), 'validated', ago(28)),
      ],
      riskLevel: 'medium', risks: [RISK_DRY, RISK_PRICE], jobs: 5, createdAt: ago(420),
    },
    {
      id: 'p-beja-fodder', farmerId: 'u-hedi', domain: 'fodder', status: 'in_progress',
      title: L('Luzerne et avoine fourragère – Béja', 'فصة وشوفان علفي – باجة'),
      summary: L('8 hectares de fourrage pour nourrir le troupeau laitier et vendre le surplus en bottes.', '8 هكتارات من الأعلاف لتغذية القطيع وبيع الفائض في رزم.'),
      description: L(
        'Premier projet de Hédi sur KHIRNA : semer 8 hectares de luzerne et d’avoine pour assurer l’autonomie fourragère de son élevage et vendre le surplus aux éleveurs voisins.',
        'أول مشروع للهادي على خيرنا: زراعة 8 هكتارات من الفصة والشوفان لضمان الاكتفاء العلفي لقطيعه وبيع الفائض للمربين المجاورين.',
      ),
      land: { owner: 'farmer', governorate: 'beja', areaHa: 8, coords: [36.705, 9.22], place: 'Béja – Oued Béja', water: 'well' },
      photos: [PHOTOS.fodder[1], PHOTOS.fodder[0], PHOTOS.fodder[2]],
      goal: 15000, minInvestment: 100, durationMonths: 9, contractType: 'profit_share',
      split: { farmer: 45, investors: 45, platform: 5, reserve: 5 },
      forecast: { pessimistic: 15000, realistic: 19500, optimistic: 22000 },
      budget: [
        b('b1', 'Semences de luzerne et d’avoine', 'بذور فصة وشوفان', 3500),
        b('b2', 'Labour et préparation du sol', 'حراثة وتحضير التربة', 4000),
        b('b3', 'Irrigation d’appoint', 'ري تكميلي', 3000),
        b('b4', 'Fauche et bottelage', 'الحش والتحزيم', 3500),
        b('b5', 'Stockage', 'تخزين', 1000),
      ],
      milestones: [
        m('m1', 'Labour et semis', 'الحراثة والبذر', 7500, ago(60), 'validated', ago(58)),
        m('m2', 'Irrigation d’appoint et entretien', 'الري التكميلي والعناية', 3000, inDays(5)),
        m('m3', 'Fauche, bottelage et stockage', 'الحش والتحزيم والتخزين', 4500, inDays(90)),
      ],
      riskLevel: 'low', risks: [RISK_DRY], jobs: 1, createdAt: ago(110),
    },
    {
      id: 'p-kebili-dates', farmerId: 'u-ali', domain: 'dates', status: 'submitted',
      title: L('Palmeraie : 150 palmiers Deglet Nour – Kébili', 'واحة: 150 نخلة دقلة نور – قبلي'),
      summary: L('Moderniser l’irrigation et la conduite de 150 palmiers Deglet Nour à Douz.', 'عصرنة الري والعناية بـ150 نخلة دقلة نور في دوز.'),
      description: L(
        'Ali modernise la palmeraie familiale : réseau d’irrigation localisée, pollinisation, ensachage des régimes contre la pluie et conditionnement pour l’export.',
        'يعصرن علي الواحة العائلية: شبكة ري موضعي، تلقيح، تغليف العراجين ضد الأمطار وتكييف للتصدير.',
      ),
      land: { owner: 'farmer', governorate: 'kebili', areaHa: 2, coords: [33.46, 9.02], place: 'Douz', water: 'irrigation' },
      photos: [PHOTOS.dates[0], PHOTOS.dates[1]],
      goal: 32000, minInvestment: 100, durationMonths: 12, contractType: 'profit_share',
      split: { farmer: 40, investors: 50, platform: 5, reserve: 5 },
      forecast: { pessimistic: 30000, realistic: 41000, optimistic: 46000 },
      budget: [
        b('b1', 'Entretien et pollinisation', 'العناية والتلقيح', 9000),
        b('b2', 'Réseau d’irrigation localisée', 'شبكة ري موضعي', 12000),
        b('b3', 'Ensachage des régimes', 'تغليف العراجين', 3000),
        b('b4', 'Récolte', 'الجني', 5000),
        b('b5', 'Conditionnement', 'التكييف', 3000),
      ],
      milestones: [
        m('m1', 'Irrigation localisée installée', 'تركيز الري الموضعي', 12000, inDays(45)),
        m('m2', 'Pollinisation et entretien', 'التلقيح والعناية', 9000, inDays(120)),
        m('m3', 'Ensachage des régimes', 'تغليف العراجين', 6000, inDays(240)),
        m('m4', 'Récolte et conditionnement', 'الجني والتكييف', 5000, inDays(330)),
      ],
      riskLevel: 'medium', risks: [RISK_DRY, RISK_CLIMATE], jobs: 3, createdAt: ago(3),
    },
  ];

  // ───────────────────────── Investissements ─────────────────────────
  const investments: Investment[] = [];
  let invSeq = 1;
  const addInv = (projectId: string, investorId: string, amount: number, date: string, contractType: ContractType, investorType: 'citizen' | 'state' = 'citizen') => {
    investments.push({ id: `i-${invSeq++}`, projectId, investorId, investorType, amount, contractType, date });
  };
  const TICKETS = [100, 150, 200, 250, 300, 300, 500, 500, 500, 750, 1000, 1000, 1500, 2000];

  /** Répartit `total` DT entre des citoyens du pool, au centime près. */
  const spread = (p: Project, total: number, seed: number, fromDays: number, toDays: number) => {
    const rand = rng(seed);
    let remaining = total;
    while (remaining > 0) {
      let amount = TICKETS[Math.floor(rand() * TICKETS.length)];
      if (remaining - amount < 100) amount = remaining;
      const investor = citizenPool[Math.floor(rand() * citizenPool.length)];
      const d = fromDays - (fromDays - toDays) * rand();
      addInv(p.id, investor, amount, ago(d), p.contractType);
      remaining -= amount;
    }
  };
  const P = (id: string) => projects.find((p) => p.id === id)!;

  // Amine : 2 investissements existants
  addInv('p-sfax-olive', 'u-amine', 1000, ago(205), 'profit_share');
  addInv('p-kasserine-olive', 'u-amine', 1500, ago(400), 'profit_share');
  // État : co-investissements
  addInv('p-siliana-lambs', 'state', 20000, ago(26), 'profit_share', 'state');
  addInv('p-kasserine-olive', 'state', 12000, ago(410), 'profit_share', 'state');

  spread(P('p-beja-cows'), 43200, 11, 33, 1);
  spread(P('p-sfax-olive'), 47000, 12, 228, 190);
  spread(P('p-nabeul-chicken'), 36000, 13, 58, 4);
  spread(P('p-korba-straw'), 18000, 14, 19, 1);
  spread(P('p-siliana-lambs'), 15000, 15, 25, 1);
  spread(P('p-kairouan-veg'), 8400, 16, 14, 1);
  spread(P('p-zaghouan-bees'), 15300, 17, 24, 1);
  spread(P('p-kasserine-olive'), 26500, 18, 415, 380);
  spread(P('p-beja-fodder'), 15000, 19, 108, 75);

  // ───────────────────────── Actualités ─────────────────────────
  const updates: Update[] = [];
  let upSeq = 1;
  const up = (projectId: string, authorId: string, kind: Update['kind'], text: L10n, date: string, photo?: string, extra: Partial<Update> = {}) => {
    const u: Update = { id: `up-${upSeq++}`, projectId, authorId, kind, text, date, photo, ...extra };
    updates.push(u);
    return u;
  };

  up('p-beja-cows', 'u-hedi', 'news', L('Sélection des génisses Holstein chez un éleveur certifié de Mateur, avec le vétérinaire.', 'اختيار عجلات هولشتاين عند مربٍّ معتمد في ماطر، مع البيطري.'), ago(20), PHOTOS.cows[1]);
  up('p-beja-cows', 'u-hedi', 'news', L('L’étable est nettoyée et la toiture réparée : prête à accueillir le troupeau dès la fin de la collecte.', 'تم تنظيف الإسطبل وإصلاح السقف: جاهز لاستقبال القطيع عند انتهاء التمويل.'), ago(8), PHOTOS.cows[3]);

  const sfaxP1 = up('p-sfax-olive', 'u-mounir', 'milestone_proof', L('Taille terminée sur les 800 oliviers. Les branches ont été broyées et laissées en paillage.', 'انتهى تقليم 800 زيتونة. تم طحن الأغصان وتركها كغطاء للتربة.'), ago(150), PHOTOS.olives[1], { milestoneId: 'm1' });
  const sfaxP2 = up('p-sfax-olive', 'u-mounir', 'milestone_proof', L('Réseau goutte-à-goutte installé : 4,2 km de gaines, un goutteur par arbre, alimenté par le puits.', 'تم تركيز شبكة الري قطرة قطرة: 4,2 كم من الأنابيب، قطّارة لكل شجرة، من البئر.'), ago(90), PHOTOS.olives[2], { milestoneId: 'm2' });
  up('p-sfax-olive', 'u-mounir', 'expense', L('Achat de compost biologique certifié (facture jointe).', 'شراء سماد عضوي بيولوجي معتمد (الفاتورة مرفقة).'), ago(40), undefined, { amount: 3200 });
  const sfaxP3 = up('p-sfax-olive', 'u-mounir', 'milestone_proof', L('Épandage du compost bio terminé. Audit Ecocert passé avec succès, certificat reçu.', 'انتهى نشر السماد البيولوجي. تم اجتياز تدقيق Ecocert بنجاح واستلام الشهادة.'), ago(2), PHOTOS.olives[3], { milestoneId: 'm3' });
  up('p-sfax-olive', 'u-mounir', 'news', L('Les olives virent au violet : la récolte commencera dans environ trois semaines.', 'الزيتون بدأ يتلوّن: الجني يبدأ بعد حوالي ثلاثة أسابيع.'), ago(1), PHOTOS.olives[0]);
  P('p-sfax-olive').milestones[0].proofUpdateId = sfaxP1.id;
  P('p-sfax-olive').milestones[1].proofUpdateId = sfaxP2.id;
  P('p-sfax-olive').milestones[2].proofUpdateId = sfaxP3.id;

  up('p-nabeul-chicken', 'u-rania', 'news', L('Collecte terminée à 100 % ! Merci à tous. Les travaux du poulailler commencent lundi.', 'اكتمل التمويل بنسبة 100٪! شكرًا للجميع. أشغال المدجنة تبدأ يوم الإثنين.'), ago(3), PHOTOS.chickens[0]);
  up('p-korba-straw', 'u-karim', 'news', L('Les arceaux et le film plastique des serres sont livrés.', 'تم تسليم أقواس وبلاستيك البيوت المحمية.'), ago(10), PHOTOS.strawberries[1]);
  up('p-siliana-lambs', 'u-salma', 'news', L('Convention de mise à disposition signée avec les Domaines de l’État pour 5 ans. Merci pour votre confiance !', 'تم إمضاء اتفاقية الوضع على الذمة مع أملاك الدولة لمدة 5 سنوات. شكرًا على ثقتكم!'), ago(12), PHOTOS.lands[2]);
  up('p-siliana-lambs', 'u-salma', 'news', L('Devis de réhabilitation de la bergerie validé, le puits a été testé : 6 m³/h.', 'تمت المصادقة على تقدير أشغال الحظيرة، وتجربة البئر: 6 م³/س.'), ago(4), PHOTOS.sheep[2]);
  up('p-kairouan-veg', 'u-mohamed', 'news', L('Analyse du sol et de l’eau du puits réalisée : bonne qualité pour la tomate.', 'تم تحليل التربة وماء البئر: جودة جيدة للطماطم.'), ago(6), PHOTOS.vegetables[3]);
  up('p-zaghouan-bees', 'u-nour', 'news', L('Le romarin fleurit sur le djebel : les colonies sont fortes, la transhumance se prépare.', 'الإكليل يزهر في الجبل: الطوائف قوية والترحال يتحضر.'), ago(5), PHOTOS.bees[1]);

  const kas = P('p-kasserine-olive');
  const kProofs: [string, L10n, number, string][] = [
    ['m1', L('Taille sévère terminée sur les 1 200 oliviers.', 'انتهى التقليم الصارم لـ1200 زيتونة.'), 299, PHOTOS.olives[1]],
    ['m2', L('Bassin et irrigation complémentaire en service.', 'الحوض والري التكميلي في الخدمة.'), 219, PHOTOS.olives[2]],
    ['m3', L('Fertilisation et labour d’entretien réalisés.', 'تم التسميد والحراثة.'), 119, PHOTOS.work[2]],
    ['m4', L('Récolte terminée : 62 tonnes d’olives triturées au moulin de Sbeïtla.', 'انتهى الجني: 62 طنًا من الزيتون عُصرت في معصرة سبيطلة.'), 29, PHOTOS.olives[0]],
  ];
  kProofs.forEach(([mid, text, d, photo]) => {
    const u = up('p-kasserine-olive', 'u-youssef', 'milestone_proof', text, ago(d), photo, { milestoneId: mid });
    kas.milestones.find((x) => x.id === mid)!.proofUpdateId = u.id;
  });
  up('p-kasserine-olive', 'u-youssef', 'news', L('11 800 litres d’huile vendus. Déclaration de récolte envoyée à KHIRNA pour la distribution.', 'بيع 11800 لتر زيت. تم إرسال التصريح بالصابة إلى خيرنا للتوزيع.'), ago(3), PHOTOS.olives[3]);

  const fod = P('p-beja-fodder');
  const fp = up('p-beja-fodder', 'u-hedi', 'milestone_proof', L('Labour et semis réalisés sur les 8 hectares (luzerne et avoine).', 'تمت الحراثة والبذر على 8 هكتارات (فصة وشوفان).'), ago(59), PHOTOS.fodder[1], { milestoneId: 'm1' });
  fod.milestones[0].proofUpdateId = fp.id;
  up('p-beja-fodder', 'u-hedi', 'news', L('La luzerne lève bien après les pluies de novembre.', 'الفصة تنبت جيدًا بعد أمطار نوفمبر.'), ago(12), PHOTOS.fodder[2]);

  // ───────────────────────── Portefeuilles et transactions ─────────────────────────
  const transactions: Transaction[] = [
    { id: 't-1', userId: 'u-amine', type: 'topup', amount: 7500, date: ago(410) },
    { id: 't-2', userId: 'u-amine', type: 'investment', amount: -1500, projectId: 'p-kasserine-olive', date: ago(400) },
    { id: 't-3', userId: 'u-amine', type: 'investment', amount: -1000, projectId: 'p-sfax-olive', date: ago(205) },
    { id: 't-4', userId: 'u-mounir', type: 'tranche', amount: 9000, projectId: 'p-sfax-olive', date: ago(148) },
    { id: 't-5', userId: 'u-mounir', type: 'tranche', amount: 16000, projectId: 'p-sfax-olive', date: ago(88) },
    { id: 't-6', userId: 'u-hedi', type: 'tranche', amount: 7500, projectId: 'p-beja-fodder', date: ago(58) },
    { id: 't-7', userId: 'u-youssef', type: 'tranche', amount: 12000, projectId: 'p-kasserine-olive', date: ago(298) },
    { id: 't-8', userId: 'u-youssef', type: 'tranche', amount: 10000, projectId: 'p-kasserine-olive', date: ago(218) },
    { id: 't-9', userId: 'u-youssef', type: 'tranche', amount: 10000, projectId: 'p-kasserine-olive', date: ago(118) },
    { id: 't-10', userId: 'u-youssef', type: 'tranche', amount: 8000, projectId: 'p-kasserine-olive', date: ago(28) },
  ];
  const wallets = [
    { userId: 'u-amine', balance: 5000 },
    { userId: 'u-hedi', balance: 7500 },
    { userId: 'u-salma', balance: 0 },
    { userId: 'u-mounir', balance: 25000 },
    { userId: 'u-youssef', balance: 40000 },
  ];

  // ───────────────────────── Terres de l'État ─────────────────────────
  const offers: Database['offers'] = [
    {
      id: 'o-siliana', name: L('Siliana Sud – lot 2', 'سليانة الجنوبية – القسط 2'),
      description: L('Ancienne ferme domaniale avec bergerie à réhabiliter et puits fonctionnel.', 'ضيعة دولية قديمة بها حظيرة تحتاج تهيئة وبئر صالح.'),
      governorate: 'siliana', areaHa: 8, vocation: 'sheep', water: 'well', durationYears: 5, coords: [36.05, 9.35], photo: PHOTOS.lands[2],
      status: 'in_use', agentId: 'u-state', publishedAt: ago(120), assignedFarmerId: 'u-salma', coInvestment: 20000, projectId: 'p-siliana-lambs', jobsEstimate: 3,
    },
    {
      id: 'o-kasserine', name: L('Foussana – lot 7', 'فوسانة – القسط 7'),
      description: L('Oliveraie domaniale de 1 200 arbres, non entretenue depuis 10 ans.', 'زياتين دولية من 1200 شجرة، غير معتنى بها منذ 10 سنوات.'),
      governorate: 'kasserine', areaHa: 15, vocation: 'olives', water: 'rain', durationYears: 6, coords: [35.35, 8.62], photo: PHOTOS.lands[4],
      status: 'in_use', agentId: 'u-state', publishedAt: ago(470), assignedFarmerId: 'u-youssef', coInvestment: 12000, projectId: 'p-kasserine-olive', jobsEstimate: 5,
    },
    {
      id: 'o-kef', name: L('Domaine de Nebeur – lot 3', 'ضيعة نبر – القسط 3'),
      description: L('Terres céréalières en bordure du barrage de Mellègue, accès au périmètre irrigué. Vocation fourragère.', 'أراضٍ حبوبية على حافة سد ملاق، مرتبطة بالمنطقة السقوية. صبغة علفية.'),
      governorate: 'kef', areaHa: 12, vocation: 'fodder', water: 'irrigation', durationYears: 7, coords: [36.29, 8.77], photo: PHOTOS.lands[1],
      status: 'reviewing', agentId: 'u-state', publishedAt: ago(25), jobsEstimate: 4,
    },
    {
      id: 'o-gaafour', name: L('Terres de Gaâfour – lot 1', 'أراضي قعفور – القسط 1'),
      description: L('Parcelle irriguée, idéale pour le maraîchage de plein champ.', 'قطعة سقوية، مثالية للخضروات في الحقول المفتوحة.'),
      governorate: 'siliana', areaHa: 6, vocation: 'vegetables', water: 'irrigation', durationYears: 5, coords: [36.32, 9.33], photo: PHOTOS.lands[3],
      status: 'open', agentId: 'u-state', publishedAt: ago(6), jobsEstimate: 3,
    },
  ];

  const applications: Database['applications'] = [
    { id: 'a-1', offerId: 'o-siliana', farmerId: 'u-salma', domain: 'sheep', experienceYears: 9, plan: 'Engraissement de 200 agneaux Barbarine, réhabilitation de la bergerie, 3 emplois.', budgetNeeded: 50000, status: 'accepted', createdAt: ago(110) },
    { id: 'a-2', offerId: 'o-kasserine', farmerId: 'u-youssef', domain: 'olives', experienceYears: 12, plan: 'Réhabilitation des 1 200 oliviers en 14 mois, irrigation complémentaire.', budgetNeeded: 40000, status: 'accepted', createdAt: ago(460) },
    { id: 'a-3', offerId: 'o-kef', farmerId: 'u-anis', domain: 'fodder', experienceYears: 5, plan: 'Avoine et vesce fourragères sur 12 ha, vente de bottes aux éleveurs du Kef.', budgetNeeded: 30000, status: 'sent', createdAt: ago(18) },
    { id: 'a-4', offerId: 'o-kef', farmerId: 'u-ines', domain: 'fodder', experienceYears: 10, plan: 'Luzerne irriguée et ensilage de maïs, contrat avec deux laiteries de Jendouba.', budgetNeeded: 42000, status: 'sent', createdAt: ago(12) },
    { id: 'a-5', offerId: 'o-kef', farmerId: 'u-salma', domain: 'sheep', experienceYears: 9, plan: 'Élevage ovin naisseur avec production de fourrage sur place.', budgetNeeded: 38000, status: 'sent', createdAt: ago(7) },
  ];

  // ───────────────────────── Visites, récoltes, notifications ─────────────────────────
  const visits: Database['visits'] = [
    { id: 'v-1', projectId: 'p-sfax-olive', citizenId: 'u-amine', wishedDate: inDays(10), message: 'J’aimerais assister au début de la récolte.', status: 'confirmed', createdAt: ago(6) },
    { id: 'v-2', projectId: 'p-beja-cows', citizenId: 'u-c03', wishedDate: inDays(6), message: 'Visite avec mon association de quartier.', status: 'requested', createdAt: ago(2) },
  ];

  const saleReports: Database['saleReports'] = [
    { id: 'sr-1', projectId: 'p-kasserine-olive', revenue: 58000, costs: 40000, note: '11 800 L d’huile vendus 4,9 DT/L à l’huilerie de Sbeïtla (facture jointe).', status: 'submitted', createdAt: ago(3) },
  ];

  let nSeq = 1;
  const n = (userId: string, type: Notification['type'], params: Notification['params'], link: string, date: string, read = false): Notification => ({
    id: `n-${nSeq++}`, userId, type, params, link, date, read,
  });
  const notifications: Notification[] = [
    n('u-amine', 'milestone_validated', { projectId: 'p-sfax-olive', milestoneId: 'm2' }, '/projects/p-sfax-olive', ago(88), true),
    n('u-amine', 'visit_confirmed', { projectId: 'p-sfax-olive', date: inDays(10) }, '/me', ago(3)),
    n('u-hedi', 'visit_requested', { projectId: 'p-beja-cows', name: 'Leila Bouazizi', date: inDays(6) }, '/farmer', ago(2)),
    n('u-hedi', 'investment_received', { projectId: 'p-beja-cows', name: 'Omar Dridi', amount: 500 }, '/projects/p-beja-cows', ago(1)),
    n('u-salma', 'coinvest_set', { offerId: 'o-siliana', amount: 20000 }, '/farmer', ago(27), true),
    n('u-salma', 'investment_received', { projectId: 'p-siliana-lambs', name: 'Sarra Ben Ali', amount: 250 }, '/projects/p-siliana-lambs', ago(1)),
    n('u-state', 'application_received', { offerId: 'o-kef', name: 'Anis Khelifi' }, '/state', ago(18), true),
    n('u-state', 'application_received', { offerId: 'o-kef', name: 'Ines Mejri' }, '/state', ago(12)),
    n('u-state', 'application_received', { offerId: 'o-kef', name: 'Salma Gharbi' }, '/state', ago(7)),
    n('u-admin', 'proof_submitted', { projectId: 'p-sfax-olive', milestoneId: 'm3' }, '/admin', ago(2)),
    n('u-admin', 'harvest_declared', { projectId: 'p-kasserine-olive' }, '/admin', ago(3)),
    n('u-admin', 'project_submitted', { projectId: 'p-kebili-dates' }, '/admin', ago(3)),
  ];

  return {
    users,
    projects,
    investments,
    wallets,
    transactions,
    updates,
    visits,
    offers,
    applications,
    saleReports,
    distributions: [],
    notifications,
  };
}
