import { lazy, Suspense } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireRole } from './components/RequireRole';
import { EmptyState } from './components/ui';
import { useI18n } from './i18n';
import { useCurrentUser } from './store/selectors';
import { dashboardPath } from './components/hooks';
import Home from './pages/Home';

const Login = lazy(() => import('./pages/Login'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Invest = lazy(() => import('./pages/Invest'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const StateLands = lazy(() => import('./pages/StateLands'));
const StateSpace = lazy(() => import('./pages/StateSpace'));
const Admin = lazy(() => import('./pages/Admin'));
const Notifications = lazy(() => import('./pages/Notifications'));

function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container-app py-16">
      <EmptyState text={t('notFound.title')} action={<Link to="/" className="btn-primary btn-sm">{t('notFound.back')}</Link>} />
    </div>
  );
}

function DashboardRedirect() {
  const user = useCurrentUser();
  return <Navigate to={dashboardPath(user?.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="projects" element={<Catalog />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/invest" element={<Invest />} />
            <Route path="dashboard" element={<DashboardRedirect />} />
            <Route path="me" element={<RequireRole roles={['citizen']}><CitizenDashboard /></RequireRole>} />
            <Route path="farmer" element={<RequireRole roles={['farmer_t1', 'farmer_t2']}><FarmerDashboard /></RequireRole>} />
            <Route path="farmer/new" element={<RequireRole roles={['farmer_t1', 'farmer_t2']}><CreateProject /></RequireRole>} />
            <Route path="lands" element={<RequireRole roles={['farmer_t2']}><StateLands /></RequireRole>} />
            <Route path="state" element={<RequireRole roles={['state_agent']}><StateSpace /></RequireRole>} />
            <Route path="admin" element={<RequireRole roles={['admin']}><Admin /></RequireRole>} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
