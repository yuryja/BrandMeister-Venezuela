// Panel · Perfil del usuario autenticado
import { api, notice, showFieldErrors, withBusy, bindPasswordTools, ROLE_LABELS, type SessionUser } from './api';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

let session: SessionUser | null = null;

async function loadProfile() {
  const res = await api<{ user: SessionUser & { created_ts: number; last_login_ts: number | null } }>('/api/profile.php');
  if (!res.ok) {
    if (res.status !== 401) notice($('profile-notice'), 'error', res.data.error || 'No se pudo cargar tu perfil.');
    return;
  }
  const u = res.data.user;
  $('profile-username')!.textContent = u.username;
  $('profile-callsign')!.textContent = u.callsign;
  const role = $('profile-role')!;
  role.textContent = ROLE_LABELS[u.role];
  role.className = `role-badge role-${u.role}`;
  ($('pf-full-name') as HTMLInputElement).value = u.full_name;
  ($('pf-email') as HTMLInputElement).value = u.email;
  (document.querySelector('#password-form [name="username"]') as HTMLInputElement).value = u.username;

  const since = new Date(u.created_ts * 1000).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
  $('profile-meta')!.textContent = `Miembro desde el ${since}.`;
}

export function initProfile() {
  if (!$('view-profile')) return;

  document.addEventListener('bm:session', (e) => (session = (e as CustomEvent<SessionUser>).detail));
  document.addEventListener('bm:view', (e) => {
    if ((e as CustomEvent<string>).detail === 'profile') {
      $('profile-notice')!.innerHTML = '';
      loadProfile();
    }
  });

  $('profile-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const res = await withBusy($('profile-submit') as HTMLButtonElement, () =>
      api('/api/profile.php', { action: 'update', full_name: fd.get('full_name'), email: fd.get('email') })
    );
    showFieldErrors(form, res.ok ? {} : res.data.validation_errors);
    notice($('profile-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo guardar.');
    if (res.ok && session && res.data.user) {
      document.dispatchEvent(new CustomEvent('bm:session', { detail: { ...session, ...res.data.user } }));
    }
  });

  $('password-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const res = await withBusy($('password-submit') as HTMLButtonElement, () =>
      api('/api/profile.php', { action: 'password', current_password: fd.get('current_password'), new_password: fd.get('new_password') })
    );
    showFieldErrors(form, res.ok ? {} : res.data.validation_errors);
    notice($('profile-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo cambiar la contraseña.');
    if (res.ok) {
      form.reset();
      ($('pw-new') as HTMLInputElement).type = 'password';
    }
  });

  bindPasswordTools($('view-profile')!);
}
