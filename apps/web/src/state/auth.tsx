import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, KeyRound, Layers3, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button, Field, Notice } from '../components/ui';

export interface AuthUser { id: number; name: string; email: string; isOwner: boolean }
export interface ManagedUser extends AuthUser { createdAt: string }
type AuthState = 'loading' | 'setup' | 'login' | 'authenticated' | 'error';
interface AuthContextValue {
  state: AuthState;
  user: AuthUser | null;
  error: string;
  reload: () => void;
  login: (email: string, password: string) => Promise<void>;
  createOwner: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  getUsers: () => Promise<ManagedUser[]>;
  createUser: (input: { name: string; email: string; password: string; passwordConfirmation: string; isOwner: boolean }) => Promise<ManagedUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const api = '/api/v1';

function xsrfToken(): string {
  const item = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  return item ? decodeURIComponent(item.slice('XSRF-TOKEN='.length)) : '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...init, headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } });
  const json = await response.json().catch(() => null) as { data?: T; message?: string; errors?: Record<string, string[]> } | null;
  if (!response.ok) {
    const validation = json?.errors ? Object.values(json.errors).flat()[0] : null;
    throw new Error(validation || json?.message || `La solicitud falló (${response.status}).`);
  }
  return (json?.data ?? json) as T;
}

async function startCsrf(): Promise<string> {
  const response = await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('No se pudo iniciar la sesión segura. Recarga la página e inténtalo de nuevo.');
  return xsrfToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    Promise.all([
      request<{ needsOwner: boolean }>(`${api}/setup/status`),
      fetch(`${api}/me`, { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
    ]).then(async ([setup, session]) => {
      if (!active) return;
      if (setup.needsOwner) { setUser(null); setState('setup'); return; }
      if (session.ok) {
        const payload = await session.json() as { data: AuthUser };
        if (!active) return;
        setUser(payload.data);
        setState('authenticated');
      } else {
        setUser(null);
        setState('login');
      }
      setError('');
    }).catch((reason: unknown) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : 'No se pudo conectar con el servidor.');
      setState('error');
    });
    return () => { active = false; };
  }, [attempt]);

  const login = useCallback(async (email: string, password: string) => {
    const token = await startCsrf();
    const payload = await request<AuthUser>(`${api}/login`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token }, body: JSON.stringify({ email, password }) });
    setUser(payload); setError(''); setState('authenticated');
  }, []);

  const createOwner = useCallback(async (name: string, email: string, password: string, passwordConfirmation: string) => {
    const token = await startCsrf();
    const payload = await request<AuthUser>(`${api}/setup/owner`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token }, body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }) });
    setUser(payload); setError(''); setState('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const token = await startCsrf();
    await request(`${api}/logout`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token } });
    setUser(null); setState('login');
  }, []);

  const getUsers = useCallback(() => request<ManagedUser[]>(`${api}/users`), []);
  const createUser = useCallback(async (input: { name: string; email: string; password: string; passwordConfirmation: string; isOwner: boolean }) => {
    const token = await startCsrf();
    return request<ManagedUser>(`${api}/users`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token }, body: JSON.stringify({ name: input.name, email: input.email, password: input.password, password_confirmation: input.passwordConfirmation, isOwner: input.isOwner }) });
  }, []);

  const value = useMemo(() => ({ state, user, error, reload: () => setAttempt((current) => current + 1), login, createOwner, logout, getUsers, createUser }), [state, user, error, login, createOwner, logout, getUsers, createUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('Falta AuthProvider.');
  return value;
}

export function AccessScreen() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFormError('');
    const data = new FormData(event.currentTarget);
    try {
      if (auth.state === 'setup') await auth.createOwner(String(data.get('name') || '').trim(), String(data.get('email') || '').trim(), String(data.get('password') || ''), String(data.get('passwordConfirmation') || ''));
      else await auth.login(String(data.get('email') || '').trim(), String(data.get('password') || ''));
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'No se pudo validar la cuenta.'); }
    finally { setBusy(false); }
  }

  return <main className="access-page">
    <section className="access-panel" aria-labelledby="access-title">
      <div className="access-brand"><div className="access-mark"><Layers3 size={25}/></div><div><b>taller</b><span>Cotizador de letreros</span></div></div>
      {auth.state === 'loading' ? <div className="access-loading" role="status"><span className="spinner"/>Comprobando acceso seguro…</div> : auth.state === 'error' ? <div className="access-content"><h1 id="access-title">No se pudo abrir el espacio</h1><p>Comprueba que la aplicación y la base de datos estén disponibles.</p><Notice tone="error">{auth.error}</Notice><Button onClick={auth.reload}>Reintentar<ArrowRight size={15}/></Button></div> : <div className="access-content">
        <div className="access-kicker"><ShieldCheck size={15}/>{auth.state === 'setup' ? 'Configuración inicial' : 'Espacio privado'}</div>
        <h1 id="access-title">{auth.state === 'setup' ? 'Crea la cuenta propietaria' : 'Vuelve a tu taller'}</h1>
        <p>{auth.state === 'setup' ? 'Esta cuenta administra el acceso y la configuración del taller.' : 'Inicia sesión para acceder a tus cotizaciones y materiales.'}</p>
        {formError ? <Notice tone="error">{formError}</Notice> : null}
        <form className="access-form" onSubmit={submit}>
          {auth.state === 'setup' ? <Field name="name" label="Nombre completo" autoComplete="name" required maxLength={180} placeholder="Tu nombre"/> : null}
          <Field name="email" label="Correo electrónico" type="email" autoComplete="username" required placeholder="nombre@empresa.com"/>
          <Field name="password" label="Contraseña" type="password" autoComplete={auth.state === 'setup' ? 'new-password' : 'current-password'} required minLength={auth.state === 'setup' ? 12 : undefined} hint={auth.state === 'setup' ? 'Usa al menos 12 caracteres.' : undefined}/>
          {auth.state === 'setup' ? <Field name="passwordConfirmation" label="Repite la contraseña" type="password" autoComplete="new-password" required minLength={12}/> : null}
          <Button type="submit" disabled={busy} className="access-submit">{busy ? 'Validando…' : auth.state === 'setup' ? 'Crear cuenta propietaria' : 'Iniciar sesión'}<ArrowRight size={16}/></Button>
        </form>
        <div className="access-security"><LockKeyhole size={15}/><span>Acceso protegido para el equipo del taller.</span></div>
      </div>}
    </section>
    <aside className="access-aside"><div className="access-blueprint" aria-hidden="true"><div className="blueprint-sheet"><div className="blueprint-line"/><div className="blueprint-cut cut-one"/><div className="blueprint-cut cut-two"/><div className="blueprint-dimension">1200 × 2400 mm</div></div></div><div className="access-aside-copy"><span><KeyRound size={16}/> Fabricación precisa</span><h2>Del plano al material,<br/>con medidas claras.</h2><p>Un espacio de trabajo para cotizar y preparar tus letreros.</p></div></aside>
  </main>;
}
