// Panel · Galería de Instagram: conexión OAuth, sincronización y moderación de publicaciones
import { api, escapeHtml, notice, timeAgo, openModal, closeModal, withBusy, type SessionUser } from './api';

type GalleryPost = {
  id: string;
  source: 'instagram' | 'manual';
  permalink: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url: string;
  carousel_media: { url: string; caption: string }[];
  video_url: string | null;
  caption: string;
  author: string;
  likes_count: number;
  comments_count: number;
  published_ts: number;
  status: 'published' | 'hidden';
};

type InstagramStatus = {
  app_configured: boolean;
  app_id: string;
  connected: boolean;
  expired: boolean;
  username: string;
  token_expires_at: number | null;
  hashtag: string;
  last_sync: number | null;
  last_sync_result: { matched: number; added: number; updated: number; hidden: number; failed_media: number } | null;
  redirect_uri: string;
  cron_command: string;
  posts_published: number;
  posts_hidden: number;
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

const TYPE_LABELS: Record<GalleryPost['media_type'], string> = { IMAGE: 'Foto', VIDEO: 'Video', CAROUSEL_ALBUM: 'Carrusel' };

// Mensajes al volver de Instagram (?instagram=...)
const RETURN_MESSAGES: Record<string, ['success' | 'error' | 'warning', string]> = {
  connected: ['success', 'Instagram conectado y primera sincronización hecha.'],
  denied: ['warning', 'Se canceló la autorización en Instagram.'],
  invalid_state: ['error', 'La autorización caducó o no se inició desde este panel. Vuelve a pulsar "Conectar con Instagram".'],
  missing_app: ['warning', 'Antes de conectar, guarda el ID y la clave secreta de la app de Instagram en "Ajustes de la app de Meta".'],
  forbidden: ['error', 'Solo un Administrador puede conectar Instagram.'],
  error: ['error', 'No se pudo completar la conexión con Instagram.'],
};

let session: SessionUser | null = null;
let posts: GalleryPost[] = [];
let filter: 'all' | 'published' | 'hidden' = 'all';
let pendingReturn: { result: string; detail: string } | null = null;

const fmtDate = (ts: number | null) =>
  ts ? new Date(ts * 1000).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

async function loadStatus() {
  const res = await api<{ instagram: InstagramStatus }>('/api/instagram.php?action=status');
  if (!res.ok) return;
  const s = res.data.instagram;
  const isAdmin = session?.role === 'admin';

  $('ig-state-connected')!.hidden = !s.connected;
  $('ig-state-disconnected')!.hidden = s.connected;
  $('ig-connect-editor-hint')!.hidden = isAdmin;
  document.querySelectorAll<HTMLElement>('#view-gallery [data-admin-only]').forEach((el) => (el.hidden = !isAdmin));

  if (s.connected) {
    const link = $('ig-username') as HTMLAnchorElement;
    link.textContent = `@${s.username}`;
    link.href = `https://www.instagram.com/${encodeURIComponent(s.username)}/`;
    $('ig-hashtag-label')!.textContent = `#${s.hashtag}`;
    $('ig-last-sync')!.textContent = s.last_sync ? timeAgo(s.last_sync) : 'Nunca';
    $('ig-expires')!.textContent = fmtDate(s.token_expires_at);
    const r = s.last_sync_result;
    $('ig-last-result')!.textContent = r
      ? `Última: ${r.matched} con el hashtag · ${r.added} nuevas · ${r.updated} actualizadas${r.hidden ? ` · ${r.hidden} ocultadas` : ''}${r.failed_media ? ` · ${r.failed_media} medios fallidos` : ''}.`
      : '';
  } else {
    $('ig-disconnected-text')!.innerHTML = s.expired
      ? '<strong>La conexión con Instagram venció.</strong> Vuelve a conectar la cuenta para seguir sincronizando.'
      : `Conecta la cuenta de Instagram para que las publicaciones con <strong>#${escapeHtml(s.hashtag)}</strong> aparezcan solas en la galería del sitio.`;
    const connect = $('ig-connect') as HTMLAnchorElement;
    connect.classList.toggle('is-disabled', !s.app_configured);
    connect.setAttribute('aria-disabled', String(!s.app_configured));
    // Si falta la app, abrir directamente sus ajustes
    if (isAdmin && !s.app_configured) ($('ig-app-settings') as HTMLDetailsElement).open = true;
  }

  $('ig-redirect-uri')!.textContent = s.redirect_uri;
  $('ig-cron-command')!.textContent = s.cron_command;
  ($('ig-hashtag') as HTMLInputElement).value = s.hashtag;
  ($('ig-app-id') as HTMLInputElement).value = s.app_id;
  ($('ig-app-secret') as HTMLInputElement).placeholder = s.app_configured ? 'Guardada · deja vacío para conservarla' : '';
}

async function loadPosts() {
  const res = await api<{ posts: GalleryPost[] }>('/api/instagram.php?scope=admin');
  if (!res.ok) {
    if (res.status !== 401) notice($('gallery-notice'), 'error', res.data.error || 'No se pudieron cargar las publicaciones.');
    return;
  }
  posts = res.data.posts;
  render();
}

function render() {
  const counts = { all: posts.length, published: 0, hidden: 0 };
  posts.forEach((p) => counts[p.status]++);
  document.querySelectorAll<HTMLElement>('#gallery-status-filter [data-count]').forEach((el) => {
    el.textContent = `(${counts[el.dataset.count as keyof typeof counts]})`;
  });
  document.querySelectorAll<HTMLElement>('#gallery-status-filter [data-gallery-filter]').forEach((el) => {
    el.classList.toggle('is-current', el.dataset.galleryFilter === filter);
  });

  const rows = posts.filter((p) => filter === 'all' || p.status === filter);
  const tbody = $('gallery-table-body')!;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">${posts.length ? 'No hay publicaciones en este filtro.' : 'Aún no hay publicaciones. Conecta Instagram y sincroniza.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((p) => {
    const caption = (p.caption || '').trim();
    const actions = [
      p.permalink ? `<span><a href="${escapeHtml(p.permalink)}" target="_blank" rel="noopener noreferrer">Ver en Instagram</a></span>` : '',
      `<span><a href="#" data-action="toggle">${p.status === 'published' ? 'Ocultar' : 'Mostrar'}</a></span>`,
      p.source === 'manual' ? `<span><a href="#" data-action="edit">Editar</a></span>` : '',
      `<span class="trash"><a href="#" data-action="delete">Eliminar</a></span>`,
    ].filter(Boolean).join(' | ');

    return `
      <tr data-post-id="${escapeHtml(p.id)}" class="${p.status === 'hidden' ? 'is-inactive' : ''}">
        <td class="col-thumb"><img src="${escapeHtml(p.thumbnail_url)}" alt="" loading="lazy" class="gallery-thumb" /></td>
        <td class="cell-title">
          <div>
            <span class="state-badge state-type">${TYPE_LABELS[p.media_type]}${p.media_type === 'CAROUSEL_ALBUM' ? ` · ${p.carousel_media.length}` : ''}</span>
            ${p.source === 'manual' ? '<span class="state-badge state-pending">Manual</span>' : ''}
            ${p.status === 'hidden' ? '<span class="state-badge state-inactive">Oculta</span>' : ''}
          </div>
          <p class="gallery-caption">${escapeHtml(caption.length > 160 ? caption.slice(0, 160) + '…' : caption) || '<span class="text-faint">Sin texto</span>'}</p>
          <div class="row-actions">${actions}</div>
        </td>
        <td class="col-num">♥ ${p.likes_count}<br><span class="text-faint">💬 ${p.comments_count}</span></td>
        <td>${fmtDate(p.published_ts)}</td>
      </tr>`;
  }).join('');
}

async function rowAction(action: string, post: GalleryPost) {
  if (action === 'toggle') {
    const status = post.status === 'published' ? 'hidden' : 'published';
    const res = await api('/api/instagram.php?action=visibility', { id: post.id, status });
    notice($('gallery-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo cambiar.');
    if (res.ok) loadPosts();
  }
  if (action === 'delete') {
    const hint = post.source === 'instagram' ? '\n\nSi sigue en Instagram con el hashtag volverá al sincronizar: mejor usa "Ocultar".' : '';
    if (!confirm(`¿Eliminar esta publicación de la galería?${hint}`)) return;
    const res = await api('/api/instagram.php?action=delete_post', { id: post.id });
    notice($('gallery-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo eliminar.');
    if (res.ok) loadPosts();
  }
  if (action === 'edit') openManual(post);
}

function openManual(post: GalleryPost | null) {
  const form = $('gallery-post-form') as HTMLFormElement;
  form.reset();
  $('gallery-post-notice')!.innerHTML = '';
  const set = (name: string, value: string) => ((form.elements.namedItem(name) as HTMLInputElement).value = value);
  set('id', post?.id ?? '');
  set('media_type', post?.media_type ?? 'IMAGE');
  set('media_url', post?.media_url ?? '');
  set('carousel', (post?.carousel_media ?? []).map((c) => c.url).join('\n'));
  set('video_url', post?.video_url ?? '');
  set('caption', post?.caption ?? '');
  set('permalink', post?.permalink ?? '');
  set('author', post?.author ?? '@brandmeister_yv');
  $('modal-gallery-title')!.textContent = post ? 'Editar publicación manual' : 'Añadir publicación manual';
  syncManualType();
  openModal($('modal-gallery-post')!);
}

function syncManualType() {
  const type = ($('gp-type') as HTMLSelectElement).value;
  $('gp-carousel-group')!.hidden = type !== 'CAROUSEL_ALBUM';
  $('gp-video-group')!.hidden = type !== 'VIDEO';
}

async function submitManual(e: Event) {
  e.preventDefault();
  const fd = new FormData(e.currentTarget as HTMLFormElement);
  const type = String(fd.get('media_type'));
  const payload = {
    id: fd.get('id') || undefined,
    media_type: type,
    media_url: fd.get('media_url'),
    carousel_media: type === 'CAROUSEL_ALBUM'
      ? String(fd.get('carousel') || '').split('\n').map((url) => url.trim()).filter(Boolean).map((url) => ({ url, caption: '' }))
      : [],
    video_url: type === 'VIDEO' ? fd.get('video_url') : '',
    caption: fd.get('caption'),
    permalink: fd.get('permalink'),
    author: fd.get('author'),
  };
  const res = await withBusy($('gallery-post-submit') as HTMLButtonElement, () => api('/api/instagram.php?action=save_post', payload));
  if (!res.ok) {
    notice($('gallery-post-notice'), 'error', res.data.error || 'No se pudo guardar.');
    return;
  }
  closeModal($('modal-gallery-post')!);
  notice($('gallery-notice'), 'success', res.data.message || 'Publicación guardada.');
  loadPosts();
}

function copyText(sourceId: string, button: HTMLElement) {
  const text = $(sourceId)?.textContent || '';
  navigator.clipboard?.writeText(text).then(() => {
    const original = button.textContent;
    button.textContent = 'Copiado';
    setTimeout(() => (button.textContent = original), 1500);
  });
}

function showReturnMessage() {
  if (!pendingReturn) return;
  const [type, message] = RETURN_MESSAGES[pendingReturn.result] ?? RETURN_MESSAGES.error;
  notice($('gallery-notice'), type, pendingReturn.detail ? `${message} (${pendingReturn.detail})` : message);
  pendingReturn = null;
}

export function initGallery() {
  if (!$('view-gallery')) return;

  // Resultado de la vuelta desde Instagram: se lee y se limpia la URL
  const params = new URLSearchParams(location.search);
  if (params.has('instagram')) {
    pendingReturn = { result: params.get('instagram') || 'error', detail: params.get('detalle') || '' };
    history.replaceState(null, '', location.pathname);
  }

  document.addEventListener('bm:session', (e) => {
    session = (e as CustomEvent<SessionUser>).detail;
    if (pendingReturn) {
      // Esperar a que el panel termine de mostrarse
      setTimeout(() => window.switchView('gallery'), 0);
    }
  });

  document.addEventListener('bm:view', (e) => {
    if ((e as CustomEvent<string>).detail !== 'gallery') return;
    loadStatus();
    loadPosts();
    showReturnMessage();
  });

  $('gallery-status-filter')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-gallery-filter]');
    if (!link) return;
    e.preventDefault();
    filter = link.dataset.galleryFilter as typeof filter;
    render();
  });

  $('gallery-table-body')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!link) return;
    e.preventDefault();
    const id = link.closest<HTMLElement>('tr')?.dataset.postId;
    const post = posts.find((p) => p.id === id);
    if (post) rowAction(link.dataset.action!, post);
  });

  $('ig-sync')!.addEventListener('click', async (e) => {
    const button = e.currentTarget as HTMLButtonElement;
    const original = button.textContent;
    button.textContent = 'Sincronizando…';
    const res = await withBusy(button, () => api('/api/instagram.php?action=sync', {}));
    button.textContent = original;
    notice($('gallery-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo sincronizar.');
    loadStatus();
    if (res.ok) loadPosts();
  });

  $('ig-connect')!.addEventListener('click', (e) => {
    if ((e.currentTarget as HTMLElement).classList.contains('is-disabled')) {
      e.preventDefault();
      notice($('gallery-notice'), 'warning', RETURN_MESSAGES.missing_app[1]);
      ($('ig-app-settings') as HTMLDetailsElement).open = true;
    }
  });

  $('ig-disconnect')!.addEventListener('click', async () => {
    if (!confirm('¿Desconectar Instagram? La galería conserva lo ya sincronizado, pero dejará de actualizarse.')) return;
    const res = await api('/api/instagram.php?action=disconnect', {});
    notice($('gallery-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo desconectar.');
    loadStatus();
  });

  $('ig-app-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const payload: Record<string, string> = {
      instagram_app_id: String(fd.get('instagram_app_id') || '').trim(),
      instagram_hashtag: String(fd.get('instagram_hashtag') || '').trim().replace(/^#/, ''),
    };
    const secret = String(fd.get('instagram_app_secret') || '').trim();
    if (secret) payload.instagram_app_secret = secret;
    const res = await withBusy($('ig-app-save') as HTMLButtonElement, () => api('/api/settings.php', payload));
    notice($('gallery-notice'), res.ok ? 'success' : 'error', res.ok ? 'Ajustes de Instagram guardados.' : res.data.error || 'No se pudieron guardar.');
    if (res.ok) {
      ($('ig-app-secret') as HTMLInputElement).value = '';
      loadStatus();
    }
  });

  $('ig-copy-redirect')!.addEventListener('click', (e) => copyText('ig-redirect-uri', e.currentTarget as HTMLElement));
  $('ig-copy-cron')!.addEventListener('click', (e) => copyText('ig-cron-command', e.currentTarget as HTMLElement));
  $('gallery-add-manual')!.addEventListener('click', () => openManual(null));
  $('gp-type')!.addEventListener('change', syncManualType);
  $('gallery-post-form')!.addEventListener('submit', submitManual);
}
