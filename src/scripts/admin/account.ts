// Panel · Pantallas públicas de cuenta: "¿Olvidaste tu contraseña?" y crear/restablecer contraseña (?clave=token)
import { api, escapeHtml, withBusy, bindPasswordTools } from './api';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

type Panel = 'login' | 'forgot' | 'set-password';

export function showAccountPanel(panel: Panel) {
  document.querySelectorAll<HTMLElement>('[data-account-panel]').forEach((el) => {
    el.hidden = el.dataset.accountPanel !== panel;
  });
  $(`account-panel-${panel}`)?.querySelector<HTMLElement>('input:not([type=hidden])')?.focus();
}

function message(id: string, type: 'error' | 'success', text: string) {
  const el = $(id)!;
  el.className = type === 'error' ? 'wp-login-error' : 'wp-login-success';
  el.textContent = text;
  el.hidden = !text;
}

/** Devuelve true si la URL trae un token y se muestra la pantalla de contraseña (no hay que comprobar sesión) */
export async function initAccount(): Promise<boolean> {
  document.querySelectorAll<HTMLElement>('[data-show-panel]').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showAccountPanel(link.dataset.showPanel as Panel);
    })
  );
  bindPasswordTools($('account-panel-set-password')!);

  $('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = ($('forgot-identifier') as HTMLInputElement).value.trim();
    const res = await withBusy($('forgot-submit') as HTMLButtonElement, () => api('/api/auth.php?action=forgot', { identifier }));
    message('forgot-message', res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo procesar la solicitud.');
  });

  const token = new URLSearchParams(location.search).get('clave');
  if (!token) return false;

  // Quitar el token de la barra de direcciones (y del historial) en cuanto se lee
  history.replaceState(null, '', location.pathname);
  showAccountPanel('set-password');

  const check = await api<{ type: 'invite' | 'reset'; user: { username: string; callsign: string; full_name: string } }>(
    `/api/auth.php?action=token&token=${encodeURIComponent(token)}`
  );
  const form = $('set-password-form') as HTMLFormElement;
  if (!check.ok) {
    form.hidden = true;
    message('set-password-message', 'error', check.data.error || 'El enlace no es válido.');
    return true;
  }

  const { type, user } = check.data;
  $('set-password-title')!.textContent = type === 'invite' ? 'Crea tu contraseña' : 'Elige una nueva contraseña';
  $('set-password-intro')!.innerHTML = `${type === 'invite' ? 'Bienvenido' : 'Hola'}, <strong>${escapeHtml(user.full_name)}</strong> (${escapeHtml(user.callsign)}). Tu usuario es <strong>${escapeHtml(user.username)}</strong>.`;
  (form.querySelector('[name="username"]') as HTMLInputElement).value = user.username;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = ($('sp-password') as HTMLInputElement).value;
    const confirmation = ($('sp-password-confirm') as HTMLInputElement).value;
    if (password !== confirmation) {
      message('set-password-message', 'error', 'Las contraseñas no coinciden.');
      return;
    }
    const res = await withBusy($('set-password-submit') as HTMLButtonElement, () =>
      api('/api/auth.php?action=set_password', { token, password })
    );
    if (!res.ok) {
      message('set-password-message', 'error', res.data.error || 'No se pudo guardar la contraseña.');
      return;
    }
    form.reset();
    showAccountPanel('login');
    ($('login-username') as HTMLInputElement).value = res.data.username || user.username;
    ($('login-password') as HTMLInputElement).focus();
    message('login-error', 'success', res.data.message || 'Contraseña guardada. Ya puedes iniciar sesión.');
  });

  return true;
}
