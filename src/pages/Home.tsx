import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Banknote, Camera, Handshake, Landmark, Lock, PieChart, Search, ShieldAlert, Sprout, Tractor, Users } from 'lucide-react';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { PUBLIC_STATUSES, sum } from '../store/selectors';
import { ProjectCard } from '../components/ProjectCard';
import { Img, StatCard } from '../components/visuals';
import { PHOTOS } from '../lib/photos';
import { groupNumber } from '../lib/format';

export default function Home() {
  const { t, lang, money } = useI18n();
  const db = useStore();
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  const publicProjects = db.projects.filter((p) => PUBLIC_STATUSES.includes(p.status));
  const publicIds = new Set(publicProjects.map((p) => p.id));
  const publicInvestments = db.investments.filter((i) => publicIds.has(i.projectId));
  const funded = sum(publicInvestments.map((i) => i.amount));
  const farmers = new Set(publicProjects.map((p) => p.farmerId)).size;
  const hectares = sum(db.offers.filter((o) => o.status === 'in_use' || o.status === 'assigned').map((o) => o.areaHa));
  const citizens = new Set(publicInvestments.filter((i) => i.investorType === 'citizen').map((i) => i.investorId)).size;

  const featured = publicProjects.filter((p) => p.featured && p.status === 'funding' && p.land.owner === 'farmer').slice(0, 3);
  const stateProjects = publicProjects.filter((p) => p.land.owner === 'state');

  return (
    <div>
      {/* Héros */}
      <section className="relative overflow-hidden">
        <Img src={PHOTOS.hero} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/80 via-primary-dark/70 to-primary-dark/90" />
        <div className="container-app relative flex flex-col items-center py-12 text-center text-white sm:py-20">
          <div className="mb-6 rounded-3xl bg-cream p-3 shadow-2xl animate-pop">
            <img src="/logo.jpeg" alt="KHIRNA خيرنا" className="h-24 w-auto rounded-2xl sm:h-32" />
          </div>
          <p dir="rtl" lang="ar" className="text-3xl font-extrabold leading-snug text-white sm:text-5xl">
            نستثمروا في أرضنا، ونكبروا بخيرنا
          </p>
          {lang === 'fr' && <p className="mt-2 text-lg font-semibold text-wheat-light sm:text-xl">{t('common.slogan')}</p>}
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{t('home.heroSubtitle')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/projects" className="btn-wheat px-6 py-3 text-base">
              <Search size={18} /> {t('home.discover')}
            </Link>
            <Link to="/login" className="btn border border-white/40 bg-white/10 px-6 py-3 text-base text-white hover:bg-white/20">
              <Tractor size={18} /> {t('home.imFarmer')}
            </Link>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="container-app -mt-8 relative z-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<Banknote size={20} />} label={t('home.impactFunded')} value={money(funded)} />
          <StatCard icon={<Tractor size={20} />} label={t('home.impactFarmers')} value={groupNumber(farmers)} tone="olive" />
          <StatCard icon={<Landmark size={20} />} label={t('home.impactHectares')} value={`${groupNumber(hectares)} ha`} tone="wheat" />
          <StatCard icon={<Users size={20} />} label={t('home.impactCitizens')} value={groupNumber(citizens)} tone="blue" />
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-app py-12">
        <h2 className="section-title text-center">{t('home.howTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <Search size={24} />, title: t('home.how1Title'), text: t('home.how1Text') },
            { icon: <Lock size={24} />, title: t('home.how2Title'), text: t('home.how2Text') },
            { icon: <Camera size={24} />, title: t('home.how3Title'), text: t('home.how3Text') },
          ].map((s, i) => (
            <div key={i} className="card relative p-6">
              <span className="absolute end-5 top-4 text-5xl font-extrabold text-primary/10">{i + 1}</span>
              <div className="mb-4 inline-flex rounded-2xl bg-primary p-3 text-white">{s.icon}</div>
              <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
              <p className="text-sm text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            { icon: <Lock size={14} />, label: t('home.pEscrow') },
            { icon: <Sprout size={14} />, label: t('home.pTranches') },
            { icon: <PieChart size={14} />, label: t('home.pSplit') },
            { icon: <ShieldAlert size={14} />, label: t('home.pRisk') },
          ].map((p) => (
            <span key={p.label} className="chip bg-white px-3 py-1.5 text-primary shadow-card">
              {p.icon} {p.label}
            </span>
          ))}
        </div>
      </section>

      {/* Projets avec l'État */}
      <section className="bg-primary text-white">
        <div className="container-app grid gap-8 py-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="chip mb-3 bg-wheat text-ink">
              <Landmark size={14} /> {t('project.state')}
            </span>
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">{t('home.stateTitle')}</h2>
            <p className="mb-6 text-white/85">{t('home.stateText')}</p>
            <ol className="mb-6 space-y-3">
              {[t('home.stateStep1'), t('home.stateStep2'), t('home.stateStep3')].map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wheat font-bold text-ink">{i + 1}</span>
                  <span className="font-semibold">{s}</span>
                </li>
              ))}
            </ol>
            <Link to="/projects?state=1" className="btn-wheat">
              <Handshake size={18} /> {t('home.stateCta')} <Arrow size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
            {stateProjects.slice(0, 2).map((p) => (
              <div key={p.id} className="text-ink">
                <ProjectCard project={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projets mis en avant */}
      <section className="container-app py-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="section-title mb-0">{t('home.featuredTitle')}</h2>
          <Link to="/projects" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {t('common.seeAll')} <Arrow size={16} />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
