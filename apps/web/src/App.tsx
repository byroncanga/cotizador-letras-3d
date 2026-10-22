import { useEffect, useState } from 'react';
import { Shapes, ArrowUpRight, Layers3 } from 'lucide-react';
import { Shell, type Page } from './components/Shell';
import { CatalogPage } from './features/catalogs/CatalogPage';
import { QuotePage } from './features/quote/QuotePage';
import { QuotesPage } from './features/projects/QuotesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { UsersPage } from './features/users/UsersPage';
import { AccessScreen, AuthProvider, useAuth } from './state/auth';
import { WorkspaceProvider, useWorkspace } from './state/workspace';
import { Button, EmptyState, SectionHeading } from './components/ui';

const pages: Page[] = ['quote', 'quotes', 'projects', 'materials', 'suppliers', 'machines', 'offcuts', 'settings', 'users'];
function route(): Page {
  const page = location.hash.replace('#/', '').split('?')[0];
  return pages.includes(page as Page) ? page as Page : 'quote';
}

function WorkspaceApplication() {
  const [page, setPage] = useState<Page>(route);
  const { state } = useWorkspace();
  const { user } = useAuth();
  useEffect(() => {
    const update = () => setPage(route());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    if (page === 'users' && !user?.isOwner) navigate('quote');
  }, [page, user?.isOwner]);

  function navigate(next: Page) {
    location.hash = `/${next}`;
    setPage(next);
    window.scrollTo({ top: 0 });
  }

  const content = page === 'quote' ? <QuotePage navigate={navigate}/>
    : page === 'materials' || page === 'suppliers' || page === 'machines' ? <CatalogPage key={page} kind={page}/>
      : page === 'quotes' || page === 'projects' ? <QuotesPage projects={page === 'projects'} onOpen={() => navigate('quote')}/>
        : page === 'users' && user?.isOwner ? <UsersPage/>
          : page === 'settings' ? <SettingsPage/>
            : <div className="page-container"><SectionHeading title="Retales reutilizables" description="El material que queda también tiene una próxima oportunidad."/><div className="offcut-rules"><div><Shapes size={22}/><b>Contorno real</b><span>Se conserva la geometría del sobrante.</span></div><div><span className="offcut-number">{state.settings.minLinearOffcutMm}<small>mm</small></span><b>Mínimo lineal reutilizable</b><span>Los sobrantes menores se descartan.</span></div><div><Layers3 size={22}/><b>Confirmación física</b><span>Revisa condición, ubicación y medidas.</span></div></div><section className="table-section"><EmptyState icon={<Shapes size={28}/>} title="Dale una segunda vida al material" description="El módulo de nesting propondrá los sobrantes de cada plancha. Se incorporarán al inventario cuando confirmes que están disponibles físicamente." action={<Button variant="secondary" onClick={() => navigate('quote')}>Volver al cotizador<ArrowUpRight size={14}/></Button>}/></section></div>;

  return <Shell page={page} navigate={navigate}>{content}</Shell>;
}

export function App() {
  const auth = useAuth();
  if (auth.state !== 'authenticated' || !auth.user) return <AccessScreen/>;
  return <WorkspaceProvider key={auth.user.id} userId={auth.user.id} isOwner={auth.user.isOwner}><WorkspaceApplication/></WorkspaceProvider>;
}

export function Root() {
  return <AuthProvider><App/></AuthProvider>;
}
