// Utilidades compartidas por los módulos del panel de administración

export type Role = 'admin' | 'editor' | 'author';

export type SessionUser = {
  id: number;
  username: string;
  callsign: string;
  full_name: string;
  email: string;
  role: Role;
  role_label?: string;
};

export type ApiResult<T = any> = {
  ok: boolean;
  status: number;
  data: T & { success?: boolean; error?: string; message?: string; validation_errors?: Record<string, string> };
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  author: 'Autor',
};

export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * fetch con JSON y cookies de sesión. Nunca lanza: los fallos de red vuelven como status 0.
 * Un 401 emite `bm:unauthorized` para que el panel vuelva al login.
 */
export async function api<T = any>(url: string, body?: unknown, method?: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.includes('action=login')) {
      document.dispatchEvent(new CustomEvent('bm:unauthorized'));
    }
    return { ok: res.ok && data?.success !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { success: false, error: 'No fue posible contactar al servidor.' } as any };
  }
}

/** Aviso estilo WordPress (admin notice) dentro de un contenedor. Desaparece al cerrarlo. */
export function notice(container: HTMLElement | null, type: 'success' | 'error' | 'warning' | 'info', message: string) {
  if (!container) return;
  container.innerHTML = `
    <div class="wp-notice wp-notice-${type}" role="${type === 'error' ? 'alert' : 'status'}">
      <p>${escapeHtml(message)}</p>
      <button type="button" class="wp-notice-dismiss" aria-label="Descartar aviso">&times;</button>
    </div>`;
  container.querySelector('.wp-notice-dismiss')?.addEventListener('click', () => (container.innerHTML = ''));
  container.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/** Marca los campos con error (validation_errors de la API) dentro de un formulario */
export function showFieldErrors(form: HTMLElement, errors: Record<string, string> = {}) {
  form.querySelectorAll('.field-error').forEach((el) => el.remove());
  form.querySelectorAll('.form-input.has-error').forEach((el) => el.classList.remove('has-error'));
  for (const [field, message] of Object.entries(errors)) {
    const input = form.querySelector<HTMLElement>(`[name="${field}"]`);
    if (!input) continue;
    input.classList.add('has-error');
    const hint = document.createElement('span');
    hint.className = 'field-error';
    hint.textContent = message;
    // En campos con botones al lado (contraseña) el aviso va debajo del grupo, no en línea
    (input.closest('.password-field') ?? input).insertAdjacentElement('afterend', hint);
  }
  form.querySelector<HTMLElement>('.has-error')?.focus();
}

/** Fecha relativa corta en español ("hace 3 días") a partir de segundos epoch */
export function timeAgo(epochSeconds: number | null | undefined): string {
  if (!epochSeconds) return '—';
  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month'], [Infinity, 'year'],
  ];
  let amount = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(amount) < size) return rtf.format(-Math.round(amount), unit);
    amount /= size;
  }
  return date.toLocaleDateString('es-VE');
}

/** Abre / cierra un .wp-modal existente (Escape y clic en el fondo lo cierran) */
const modalListeners = new WeakMap<HTMLElement, AbortController>();

export function openModal(modal: HTMLElement) {
  modalListeners.get(modal)?.abort();
  const controller = new AbortController();
  modalListeners.set(modal, controller);

  modal.style.display = 'flex';
  modal.querySelector<HTMLElement>('input, textarea, select, button.btn-primary')?.focus();
  modal.querySelectorAll('[data-close-modal]').forEach((el) =>
    el.addEventListener('click', () => closeModal(modal), { signal: controller.signal })
  );
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal(modal), { signal: controller.signal });
}

export function closeModal(modal: HTMLElement) {
  modal.style.display = 'none';
  modalListeners.get(modal)?.abort();
  modalListeners.delete(modal);
}

/** Botones "Generar" y "Mostrar" junto a los campos de contraseña (data-generate-password / data-toggle-password) */
export function bindPasswordTools(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>('[data-generate-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.generatePassword!) as HTMLInputElement | null;
      if (!input) return;
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*-_';
      const bytes = crypto.getRandomValues(new Uint32Array(16));
      input.value = Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('');
      input.type = 'text';
      const toggle = root.querySelector<HTMLButtonElement>(`[data-toggle-password="${input.id}"]`);
      if (toggle) toggle.textContent = 'Ocultar';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.select();
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword!) as HTMLInputElement | null;
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Ocultar' : 'Mostrar';
    });
  });
}

/** Deshabilita un botón mientras dura una promesa */
export async function withBusy<T>(button: HTMLButtonElement | null, task: () => Promise<T>): Promise<T> {
  if (button) button.disabled = true;
  try {
    return await task();
  } finally {
    if (button) button.disabled = false;
  }
}

declare global {
  interface Window {
    switchView: (view: string) => void;
  }
}
