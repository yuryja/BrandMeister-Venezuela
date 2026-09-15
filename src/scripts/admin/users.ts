// Backoffice · Usuarios: listado, alta/edición, invitaciones, correos y acciones en lote
import {
  api, escapeHtml, notice, showFieldErrors, timeAgo, openModal, closeModal, withBusy, bindPasswordTools,
  ROLE_LABELS, type Role, type SessionUser,
} from './api';

type UserRow = {
  id: number;
  username: string;
  callsign: string;
  full_name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  created_ts: number;
  last_login_ts: number | null;
  pending_invite: boolean;
  posts_count: number;
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

let users: UserRow[] = [];
let session: SessionUser | null = null;
let roleFilter: Role | '' = '';
let search = '';
// Usuario en edición (null = alta). pendingEdit se consume al abrir la vista "user-new"
let editing: UserRow | null = null;
let pendingEdit: UserRow | null = null;
let emailRecipients: UserRow[] = [];
let deleting: UserRow | null = null;

const listNotice = () => $('users-notice');

async function loadUsers() {
  const res = await api<{ users: UserRow[]; mail_configured: boolean }>('/api/users.php');
  if (!res.ok) {
    if (res.status !== 401) notice(listNotice(), 'error', res.data.error || 'No se pudo cargar la lista de usuarios.');
    return;
  }
  users = res.data.users;
  $('users-mail-warning')!.hidden = res.data.mail_configured;
  render();
}

function filtered() {
  const q = search.trim().toLowerCase();
  return users.filter((u) =>
    (!roleFilter || u.role === roleFilter) &&
    (!q || [u.username, u.callsign, u.full_name, u.email].some((v) => v.toLowerCase().includes(q)))
  );
}

function renderFilters() {
  const counts: Record<string, number> = { '': users.length };
  users.forEach((u) => (counts[u.role] = (counts[u.role] || 0) + 1));
  const items: [Role | '', string][] = [['', 'Todos'], ['admin', 'Administradores'], ['editor', 'Editores'], ['author', 'Autores']];
  $('users-role-filter')!.innerHTML = items
    .filter(([role]) => role === '' || counts[role])
    .map(([role, label]) =>
      `<li><a href="#" data-role-filter="${role}" class="${role === roleFilter ? 'is-current' : ''}">${label} <span class="count">(${counts[role] || 0})</span></a></li>`
    )
    .join('');
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function render() {
  renderFilters();
  const rows = filtered();
  $('users-count')!.textContent = `${rows.length} ${rows.length === 1 ? 'elemento' : 'elementos'}`;
  ($('users-select-all') as HTMLInputElement).checked = false;

  const tbody = $('users-table-body')!;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No se encontraron usuarios.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((u) => {
    const isSelf = u.id === session?.id;
    const badges = [
      isSelf ? '<span class="state-badge state-self">Tú</span>' : '',
      u.status === 'inactive' ? '<span class="state-badge state-inactive">Desactivado</span>' : '',
      u.pending_invite ? '<span class="state-badge state-pending">Invitación pendiente</span>' : '',
    ].join('');

    const actions = [
      `<span><a href="#" data-action="edit">Editar</a></span>`,
      `<span><a href="#" data-action="email">Enviar correo</a></span>`,
      u.status === 'active'
        ? `<span><a href="#" data-action="invite">${u.pending_invite ? 'Reenviar invitación' : 'Enviar enlace de contraseña'}</a></span>`
        : '',
      !isSelf ? `<span><a href="#" data-action="${u.status === 'active' ? 'deactivate' : 'activate'}">${u.status === 'active' ? 'Desactivar' : 'Activar'}</a></span>` : '',
      !isSelf ? `<span class="trash"><a href="#" data-action="delete">Eliminar</a></span>` : '',
    ].filter(Boolean).join(' | ');

    return `
      <tr data-user-id="${u.id}" class="${u.status === 'inactive' ? 'is-inactive' : ''}">
        <td class="col-cb">${isSelf ? '' : `<input type="checkbox" class="user-cb" value="${u.id}" aria-label="Seleccionar ${escapeHtml(u.username)}" />`}</td>
        <td class="cell-title">
          <div class="user-cell">
            <span class="user-avatar" aria-hidden="true">${escapeHtml(initials(u.full_name))}</span>
            <div>
              <strong><a href="#" data-action="edit">${escapeHtml(u.username)}</a></strong>
              <span class="callsign-badge">${escapeHtml(u.callsign)}</span>
              ${badges}
              <div class="row-actions">${actions}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(u.full_name)}</td>
        <td><a href="mailto:${escapeHtml(u.email)}">${escapeHtml(u.email)}</a></td>
        <td><span class="role-badge role-${u.role}">${ROLE_LABELS[u.role]}</span></td>
        <td class="col-num">${u.posts_count}</td>
        <td title="${u.last_login_ts ? new Date(u.last_login_ts * 1000).toLocaleString('es-VE') : ''}">${u.last_login_ts ? timeAgo(u.last_login_ts) : '<span class="text-faint">Nunca</span>'}</td>
      </tr>`;
  }).join('');
}

function selectedIds(): number[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('.user-cb:checked')).map((cb) => Number(cb.value));
}

// ---------------------------------------------------------------------------
// Alta / edición
// ---------------------------------------------------------------------------
export function openUserForm(user: UserRow | null) {
  pendingEdit = user;
  window.switchView('user-new');
}

function prepareForm() {
  editing = pendingEdit;
  pendingEdit = null;
  const form = $('user-form') as HTMLFormElement;
  const isEdit = editing !== null;
  form.reset();
  showFieldErrors(form);
  $('user-form-notice')!.innerHTML = '';

  const set = (name: string, value: string) => ((form.elements.namedItem(name) as HTMLInputElement).value = value);
  set('id', isEdit ? String(editing!.id) : '');
  set('username', editing?.username ?? '');
  set('callsign', editing?.callsign ?? '');
  set('full_name', editing?.full_name ?? '');
  set('email', editing?.email ?? '');
  set('role', editing?.role ?? 'author');
  set('status', editing?.status ?? 'active');

  const isSelf = isEdit && editing!.id === session?.id;
  ($('uf-role') as HTMLSelectElement).disabled = isSelf;
  ($('uf-status') as HTMLSelectElement).disabled = isSelf;

  $('user-form-title')!.textContent = isEdit ? `Editar usuario ${editing!.callsign}` : 'Añadir nuevo usuario';
  $('user-form-intro')!.textContent = isEdit
    ? (isSelf ? 'Estás editando tu propia cuenta: no puedes cambiar tu rol ni desactivarte.' : 'Modifica los datos, el rol o el estado de la cuenta.')
    : 'Crea una cuenta para un radioaficionado del equipo. Recibirá un correo para elegir su contraseña.';
  $('user-form-submit')!.textContent = isEdit ? 'Actualizar usuario' : 'Añadir nuevo usuario';
  $('uf-status-row')!.hidden = !isEdit;
  $('uf-invite-row')!.hidden = isEdit;
  ($('uf-send-invite') as HTMLInputElement).checked = true;
  syncPasswordRow();

  const password = $('uf-password') as HTMLInputElement;
  password.type = 'password';
  $('uf-password-label')!.textContent = isEdit ? 'Nueva contraseña' : 'Contraseña';
  $('uf-password-hint')!.textContent = isEdit
    ? 'Déjala vacía para no cambiarla. Mínimo 10 caracteres. Mejor: usa "Enviar enlace de contraseña" en el listado.'
    : 'Mínimo 10 caracteres. Compártela con la persona por un canal seguro.';

  ($('uf-username') as HTMLInputElement).focus();
}

function syncPasswordRow() {
  const inviting = ($('uf-send-invite') as HTMLInputElement).checked;
  $('uf-password-row')!.hidden = editing === null && inviting;
}

async function submitUserForm(e: Event) {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const fd = new FormData(form);
  const isEdit = editing !== null;

  const payload: Record<string, unknown> = {
    action: isEdit ? 'update' : 'create',
    id: isEdit ? editing!.id : undefined,
    username: String(fd.get('username') || ''),
    callsign: String(fd.get('callsign') || '').toUpperCase(),
    full_name: String(fd.get('full_name') || ''),
    email: String(fd.get('email') || ''),
    // Los select deshabilitados no viajan en FormData: se conserva el valor actual
    role: ($('uf-role') as HTMLSelectElement).value,
    status: ($('uf-status') as HTMLSelectElement).value,
    password: $('uf-password-row')!.hidden ? '' : String(fd.get('password') || ''),
    send_invite: !isEdit && ($('uf-send-invite') as HTMLInputElement).checked,
  };

  const res = await withBusy($('user-form-submit') as HTMLButtonElement, () => api('/api/users.php', payload));
  if (!res.ok) {
    showFieldErrors(form, res.data.validation_errors);
    notice($('user-form-notice'), 'error', res.data.error || 'No se pudo guardar el usuario.');
    return;
  }

  showFieldErrors(form);
  await loadUsers();
  window.switchView('users');
  notice(listNotice(), res.data.mail_sent === false ? 'warning' : 'success', res.data.message || 'Usuario guardado.');

  // Si el admin se editó a sí mismo, refrescar el nombre en la barra
  if (isEdit && editing!.id === session?.id && res.data.user) {
    document.dispatchEvent(new CustomEvent('bm:session', { detail: { ...session, ...res.data.user } }));
  }
}

// ---------------------------------------------------------------------------
// Acciones de fila
// ---------------------------------------------------------------------------
async function rowAction(action: string, user: UserRow) {
  switch (action) {
    case 'edit':
      return openUserForm(user);
    case 'email':
      return openEmail([user]);
    case 'delete':
      return openDelete(user);
    case 'invite': {
      const label = user.pending_invite ? 'la invitación' : 'un enlace para restablecer la contraseña';
      if (!confirm(`¿Enviar ${label} a ${user.email}?`)) return;
      const res = await api('/api/users.php', { action: 'invite', id: user.id });
      notice(listNotice(), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'Error al enviar.');
      return;
    }
    case 'activate':
    case 'deactivate': {
      const res = await api('/api/users.php', { action: 'update', id: user.id, status: action === 'activate' ? 'active' : 'inactive' });
      notice(listNotice(), res.ok ? 'success' : 'error',
        res.ok ? `Cuenta de ${user.callsign} ${action === 'activate' ? 'activada' : 'desactivada'}.` : (res.data.error || 'No se pudo cambiar el estado.'));
      if (res.ok) loadUsers();
      return;
    }
  }
}

function openEmail(recipients: UserRow[]) {
  emailRecipients = recipients;
  const form = $('user-email-form') as HTMLFormElement;
  form.reset();
  showFieldErrors(form);
  $('user-email-notice')!.innerHTML = '';
  const names = recipients.map((u) => `${u.full_name} (${u.callsign})`);
  $('user-email-recipients')!.textContent = names.length > 4 ? `${names.slice(0, 4).join(', ')} y ${names.length - 4} más` : names.join(', ');
  openModal($('modal-user-email')!);
}

async function submitEmail(e: Event) {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const fd = new FormData(form);
  const res = await withBusy($('user-email-submit') as HTMLButtonElement, () =>
    api('/api/users.php', {
      action: 'email',
      user_ids: emailRecipients.map((u) => u.id),
      subject: fd.get('subject'),
      message: fd.get('message'),
    })
  );
  if (!res.ok) {
    showFieldErrors(form, res.data.validation_errors);
    notice($('user-email-notice'), 'error', res.data.error || 'No se pudo enviar el correo.');
    return;
  }
  closeModal($('modal-user-email')!);
  notice(listNotice(), res.data.failed?.length ? 'warning' : 'success', res.data.message);
}

function openDelete(user: UserRow) {
  deleting = user;
  $('user-delete-notice')!.innerHTML = '';
  $('user-delete-name')!.textContent = `${user.full_name} (${user.callsign})`;
  const hasPosts = user.posts_count > 0;
  $('user-delete-reassign')!.hidden = !hasPosts;
  $('user-delete-posts')!.textContent = String(user.posts_count);
  const select = $('ud-reassign') as HTMLSelectElement;
  select.innerHTML = users
    .filter((u) => u.id !== user.id && u.status === 'active')
    .map((u) => `<option value="${u.id}" ${u.id === session?.id ? 'selected' : ''}>${escapeHtml(u.full_name)} (${escapeHtml(u.callsign)})</option>`)
    .join('');
  openModal($('modal-user-delete')!);
}

async function submitDelete(e: Event) {
  e.preventDefault();
  if (!deleting) return;
  const reassign = deleting.posts_count > 0 ? Number(($('ud-reassign') as HTMLSelectElement).value) : undefined;
  const res = await withBusy($('user-delete-submit') as HTMLButtonElement, () =>
    api('/api/users.php', { action: 'delete', id: deleting!.id, reassign_to: reassign })
  );
  if (!res.ok) {
    notice($('user-delete-notice'), 'error', res.data.error || 'No se pudo eliminar el usuario.');
    return;
  }
  closeModal($('modal-user-delete')!);
  notice(listNotice(), 'success', res.data.message);
  loadUsers();
}

async function applyBulk() {
  const operation = ($('users-bulk-action') as HTMLSelectElement).value;
  const ids = selectedIds();
  if (!operation) return notice(listNotice(), 'info', 'Elige una acción en lote.');
  if (!ids.length) return notice(listNotice(), 'info', 'Selecciona al menos un usuario.');

  if (operation === 'email') {
    return openEmail(users.filter((u) => ids.includes(u.id)));
  }
  const res = await api('/api/users.php', { action: 'bulk', operation, user_ids: ids });
  notice(listNotice(), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo aplicar la acción.');
  if (res.ok) {
    ($('users-bulk-action') as HTMLSelectElement).value = '';
    loadUsers();
  }
}

// ---------------------------------------------------------------------------
// Inicialización
// ---------------------------------------------------------------------------
export function initUsers() {
  if (!$('view-users')) return;

  document.addEventListener('bm:session', (e) => (session = (e as CustomEvent<SessionUser>).detail));
  document.addEventListener('bm:view', (e) => {
    const view = (e as CustomEvent<string>).detail;
    if (session?.role !== 'admin') return;
    if (view === 'users') loadUsers();
    if (view === 'user-new') prepareForm();
  });

  $('users-role-filter')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-role-filter]');
    if (!link) return;
    e.preventDefault();
    roleFilter = (link.dataset.roleFilter as Role | '') ?? '';
    render();
  });

  $('users-search')!.addEventListener('input', (e) => {
    search = (e.target as HTMLInputElement).value;
    render();
  });

  $('users-select-all')!.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    document.querySelectorAll<HTMLInputElement>('.user-cb').forEach((cb) => (cb.checked = checked));
  });

  $('users-table-body')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!link) return;
    e.preventDefault();
    const id = Number(link.closest<HTMLElement>('tr')?.dataset.userId);
    const user = users.find((u) => u.id === id);
    if (user) rowAction(link.dataset.action!, user);
  });

  $('users-bulk-apply')!.addEventListener('click', applyBulk);
  $('user-form')!.addEventListener('submit', submitUserForm);
  $('uf-send-invite')!.addEventListener('change', syncPasswordRow);
  $('uf-callsign')!.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
  });
  $('user-email-form')!.addEventListener('submit', submitEmail);
  $('user-delete-form')!.addEventListener('submit', submitDelete);
  bindPasswordTools($('view-user-new')!);
}
