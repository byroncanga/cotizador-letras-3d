import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Plus, Shield, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import type { ManagedUser } from '../../state/auth';
import { useAuth } from '../../state/auth';
import { Badge, Button, Drawer, EmptyState, Field, Notice, SectionHeading } from '../../components/ui';
import { date } from '../../lib/format';

export function UsersPage() {
  const auth = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { setUsers(await auth.getUsers()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar el equipo.'); }
    finally { setLoading(false); }
  }, [auth.getUsers]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    const form = new FormData(event.currentTarget);
    try {
      const user = await auth.createUser({ name: String(form.get('name') || '').trim(), email: String(form.get('email') || '').trim(), password: String(form.get('password') || ''), passwordConfirmation: String(form.get('passwordConfirmation') || ''), isOwner: form.get('isOwner') === 'on' });
      setUsers((current) => [...current, user].sort((a, b) => a.name.localeCompare(b.name)));
      setOpen(false); setSuccess(`La cuenta de ${user.name} está lista para iniciar sesión.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta.'); }
    finally { setSaving(false); }
  }

  return <div className="page-container users-page">
    <SectionHeading title="Usuarios del taller" description="Administra quién puede entrar al espacio de trabajo." action={<Button onClick={() => { setError(''); setOpen(true); }}><Plus size={16}/>Crear usuario</Button>}/>
    {success ? <div className="inline-success" role="status"><ShieldCheck size={16}/>{success}</div> : null}
    {error && !open ? <div role="alert"><Notice tone="error">{error}</Notice></div> : null}
    <section className="user-summary"><div className="user-summary-icon"><UsersRound size={22}/></div><div><b>{loading ? '…' : users.length}</b><span>cuentas activas</span></div><p>Las cuentas del equipo pueden iniciar sesión en este taller. Solo el propietario puede gestionar usuarios.</p><Badge tone="teal">Acceso interno</Badge></section>
    <section className="table-section users-table-section"><div className="table-toolbar"><div className="table-tabs"><span>Equipo</span><Badge>{users.length}</Badge></div></div>
      {loading ? <div className="user-loading" role="status">Cargando usuarios…</div> : users.length ? <div className="table-scroll"><table><thead><tr><th>Persona</th><th>Correo electrónico</th><th>Acceso</th><th>Creada</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="table-name"><span className={`user-avatar ${user.isOwner ? 'owner-avatar' : ''}`}><UserRound size={17}/></span><div><b>{user.name}</b><small>{user.isOwner ? 'Administrador del taller' : 'Equipo de fabricación'}</small></div></div></td><td>{user.email}</td><td><span className={`role-pill ${user.isOwner ? 'role-owner' : ''}`}>{user.isOwner ? <ShieldCheck size={14}/> : <Shield size={14}/>}{user.isOwner ? 'Propietario' : 'Operador'}</span></td><td className="muted">{date(user.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState icon={<UsersRound size={26}/>} title="Aún no hay cuentas" description="Crea una cuenta para cada persona que necesite entrar al cotizador." action={<Button onClick={() => setOpen(true)}><Plus size={15}/>Crear usuario</Button>}/>}
    </section>
    <Drawer open={open} onOpenChange={setOpen} title="Crear usuario" description="La persona podrá iniciar sesión con el correo y la contraseña que definas.">
      <form className="drawer-form user-form" onSubmit={submit} key={String(open)}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Field name="name" label="Nombre completo" autoComplete="name" required maxLength={180} placeholder="Ej. Ana Canga"/>
        <Field name="email" label="Correo electrónico" type="email" autoComplete="email" required maxLength={255} placeholder="ana@empresa.com"/>
        <div className="form-divider">Credenciales de acceso</div>
        <Field name="password" label="Contraseña inicial" type="password" autoComplete="new-password" required minLength={12} hint="Mínimo 12 caracteres. Entrégala a la persona por un canal privado."/>
        <Field name="passwordConfirmation" label="Repetir contraseña" type="password" autoComplete="new-password" required minLength={12}/>
        <label className="checkbox-field"><input name="isOwner" type="checkbox"/><span>Dar permisos de propietario<small>Podrá configurar materiales, costos y gestionar usuarios.</small></span></label>
        <div className="user-password-note"><KeyRound size={15}/><span>Las contraseñas se guardan protegidas; nunca se muestran en la lista.</span></div>
        <div className="drawer-footer"><Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Creando…' : 'Crear cuenta'}</Button></div>
      </form>
    </Drawer>
  </div>;
}
