// Panel · Galería: listado, subida optimizada (WebP / video comprimido) y edición de publicaciones
import { api, escapeHtml, notice, showFieldErrors, withBusy, type SessionUser } from './api';
import { processImage, processVideo, uploadInChunks, formatBytes, type ProcessedImage, type ProcessedVideo } from './media';

type GalleryPost = {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url: string;
  carousel_media: { url: string }[];
  video_url: string | null;
  caption: string;
  author: string;
  permalink: string | null;
  published_ts: number;
  status: 'published' | 'hidden';
};

type MediaItem = {
  key: string;
  kind: 'image' | 'video';
  file: File;
  state: 'processing' | 'ready' | 'error';
  progress: number;
  error?: string;
  previewUrl?: string;
  image?: ProcessedImage;
  video?: ProcessedVideo;
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
const TYPE_LABELS: Record<GalleryPost['media_type'], string> = { IMAGE: 'Foto', VIDEO: 'Video', CAROUSEL_ALBUM: 'Carrusel' };

let session: SessionUser | null = null;
let posts: GalleryPost[] = [];
let filter: 'all' | 'published' | 'hidden' = 'all';
let editing: GalleryPost | null = null;
let pendingEdit: GalleryPost | null = null;
let items: MediaItem[] = [];
let videoAbort: AbortController | null = null;
let saving = false;

const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' });
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Listado
// ---------------------------------------------------------------------------
async function loadPosts() {
  const res = await api<{ posts: GalleryPost[] }>('/api/gallery.php?scope=admin');
  if (!res.ok) {
    if (res.status !== 401) notice($('gallery-notice'), 'error', res.data.error || 'No se pudieron cargar las publicaciones.');
    return;
  }
  posts = res.data.posts;
  renderList();
}

function renderList() {
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
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">${posts.length ? 'No hay publicaciones en este filtro.' : 'Aún no hay publicaciones. Pulsa "Añadir publicación".'}</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((p) => {
    const caption = p.caption.trim();
    const count = p.media_type === 'CAROUSEL_ALBUM' ? ` · ${p.carousel_media.length}` : '';
    return `
      <tr data-post-id="${escapeHtml(p.id)}" class="${p.status === 'hidden' ? 'is-inactive' : ''}">
        <td class="col-thumb">
          <a href="#" data-action="edit" aria-label="Editar publicación"><img src="${escapeHtml(p.thumbnail_url)}" alt="" loading="lazy" class="gallery-thumb" /></a>
        </td>
        <td class="cell-title">
          <div>
            <span class="state-badge state-type">${TYPE_LABELS[p.media_type]}${count}</span>
            ${p.status === 'hidden' ? '<span class="state-badge state-inactive">Oculta</span>' : ''}
          </div>
          <p class="gallery-caption"><a href="#" data-action="edit">${escapeHtml(caption.length > 140 ? caption.slice(0, 140) + '…' : caption) || '<span class="text-faint">(sin descripción)</span>'}</a></p>
          <div class="row-actions">
            <span><a href="#" data-action="edit">Editar</a></span> |
            <span><a href="#" data-action="toggle">${p.status === 'published' ? 'Ocultar' : 'Mostrar'}</a></span> |
            <span class="trash"><a href="#" data-action="delete">Eliminar</a></span>
          </div>
        </td>
        <td>${escapeHtml(p.author)}</td>
        <td>${fmtDate(p.published_ts)}</td>
      </tr>`;
  }).join('');
}

async function rowAction(action: string, post: GalleryPost) {
  if (action === 'edit') {
    pendingEdit = post;
    window.switchView('gallery-edit');
  }
  if (action === 'toggle') {
    const res = await api('/api/gallery.php?action=visibility', { id: post.id, status: post.status === 'published' ? 'hidden' : 'published' });
    notice($('gallery-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo cambiar.');
    if (res.ok) loadPosts();
  }
  if (action === 'delete') {
    if (!confirm('¿Eliminar esta publicación y sus archivos? No se puede deshacer.')) return;
    const res = await api('/api/gallery.php?action=delete', { id: post.id });
    notice($('gallery-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo eliminar.');
    if (res.ok) loadPosts();
  }
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
function resetItems() {
  videoAbort?.abort();
  videoAbort = null;
  items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
  items = [];
}

function prepareEditor() {
  editing = pendingEdit;
  pendingEdit = null;
  resetItems();

  const form = $('gallery-form') as HTMLFormElement;
  form.reset();
  showFieldErrors(form);
  $('gallery-edit-notice')!.innerHTML = '';
  setProgress(null);

  const set = (name: string, value: string) => ((form.elements.namedItem(name) as HTMLInputElement).value = value);
  set('id', editing?.id ?? '');
  set('caption', editing?.caption ?? '');
  set('status', editing?.status ?? 'published');
  set('author', editing?.author ?? '@brandmeister_yv');
  set('permalink', editing?.permalink ?? '');
  if (editing) {
    const d = new Date(editing.published_ts * 1000);
    set('published_date', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  } else {
    set('published_date', todayIso());
  }

  $('gallery-edit-title')!.textContent = editing ? 'Editar publicación' : 'Añadir publicación';
  $('gallery-submit')!.textContent = editing ? 'Actualizar' : 'Publicar';
  $('gallery-current-media-hint')!.hidden = !editing;
  updateCaptionCount();
  renderMedia();
}

function renderMedia() {
  const list = $('gallery-media-list')!;
  const imageItems = items.filter((i) => i.kind === 'image');

  let html = '';
  // Medios actuales (solo en edición y si no se han añadido nuevos)
  if (editing && !items.length) {
    const current = editing.media_type === 'CAROUSEL_ALBUM' ? editing.carousel_media.map((c) => c.url) : [editing.thumbnail_url];
    html = current.map((url, i) => `
      <li class="media-tile is-current">
        <img src="${escapeHtml(url)}" alt="" />
        ${editing!.media_type === 'VIDEO' ? '<span class="media-tile-badge">▶ Video</span>' : `<span class="media-tile-badge">${i + 1}</span>`}
      </li>`).join('');
  }

  html += items.map((item) => {
    const index = imageItems.indexOf(item);
    const size = item.image
      ? `${item.image.width}×${item.image.height} · ${formatBytes(item.image.blob.size)}`
      : item.video
        ? `${item.video.width}×${item.video.height} · ${formatBytes(item.video.blob.size)}${item.video.compressed ? '' : ' (original)'}`
        : '';
    const saved = item.image || item.video
      ? Math.max(0, Math.round((1 - (item.image?.blob.size ?? item.video!.blob.size) / item.file.size) * 100))
      : 0;
    const status = item.state === 'processing'
      ? `<span class="media-tile-status">${item.kind === 'video' ? `Comprimiendo ${Math.round(item.progress * 100)}%` : 'Optimizando…'}</span>`
      : item.state === 'error'
        ? `<span class="media-tile-status is-error">${escapeHtml(item.error || 'Error')}</span>`
        : `<span class="media-tile-status is-ready">${size}${saved > 0 ? ` · −${saved}%` : ''}</span>`;

    return `
      <li class="media-tile ${item.state === 'error' ? 'has-error' : ''}" data-key="${item.key}">
        ${item.previewUrl ? (item.kind === 'video' && !item.video ? '<div class="media-tile-placeholder">▶</div>' : `<img src="${item.previewUrl}" alt="" />`) : '<div class="media-tile-placeholder">…</div>'}
        ${item.kind === 'video' ? '<span class="media-tile-badge">▶ Video</span>' : `<span class="media-tile-badge">${index + 1}</span>`}
        ${item.state === 'processing' ? `<div class="media-tile-meter"><span style="width:${Math.round(item.progress * 100)}%"></span></div>` : ''}
        <div class="media-tile-tools">
          ${item.kind === 'image' && imageItems.length > 1 ? `
            <button type="button" data-media-action="left" aria-label="Mover antes" ${index === 0 ? 'disabled' : ''}>←</button>
            <button type="button" data-media-action="right" aria-label="Mover después" ${index === imageItems.length - 1 ? 'disabled' : ''}>→</button>` : ''}
          <button type="button" data-media-action="remove" aria-label="Quitar">✕</button>
        </div>
        ${status}
      </li>`;
  }).join('');

  list.innerHTML = html;

  const ready = items.filter((i) => i.state === 'ready');
  const processing = items.some((i) => i.state === 'processing');
  const before = ready.reduce((sum, i) => sum + i.file.size, 0);
  const after = ready.reduce((sum, i) => sum + (i.image?.blob.size ?? i.video?.blob.size ?? 0), 0);
  $('gallery-media-summary')!.textContent = ready.length
    ? `${ready.length} listo(s) · ${formatBytes(before)} → ${formatBytes(after)}${processing ? ' · procesando…' : ''}`
    : processing ? 'Procesando…' : '';
}

async function addFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList);
  const videos = files.filter((f) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(f.name));
  const images = files.filter((f) => !videos.includes(f) && (f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|gif|avif)$/i.test(f.name)));
  const ignored = files.length - videos.length - images.length;
  const noticeEl = $('gallery-edit-notice');

  const hasVideo = items.some((i) => i.kind === 'video');
  const hasImages = items.some((i) => i.kind === 'image');
  if (videos.length > 1 || (videos.length && (images.length || hasImages || hasVideo)) || (images.length && hasVideo)) {
    notice(noticeEl, 'warning', 'Cada publicación lleva varias fotos o un solo video, no ambos. Crea otra publicación para el resto.');
    return;
  }
  if (items.length + images.length > 20) {
    notice(noticeEl, 'warning', 'Máximo 20 fotos por publicación.');
    return;
  }
  if (ignored) {
    notice(noticeEl, 'info', `${ignored} archivo(s) no son fotos ni videos y se ignoraron.`);
  }

  const newItems: MediaItem[] = [...images, ...videos].map((file) => ({
    key: Math.random().toString(36).slice(2),
    kind: videos.includes(file) ? 'video' : 'image',
    file,
    state: 'processing',
    progress: 0,
  }));
  items.push(...newItems);
  renderMedia();

  // Fotos de dos en dos para no saturar la memoria del móvil
  const queue = newItems.filter((i) => i.kind === 'image');
  const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      try {
        item.image = await processImage(item.file);
        item.previewUrl = URL.createObjectURL(item.image.blob);
        item.state = 'ready';
      } catch {
        item.state = 'error';
        item.error = /hei[cf]$/i.test(item.file.name) ? 'HEIC solo se puede leer en Safari: conviértela a JPG' : 'No se pudo leer esta imagen';
      }
      if (items.includes(item)) renderMedia();
    }
  });

  const videoItem = newItems.find((i) => i.kind === 'video');
  if (videoItem) {
    videoAbort = new AbortController();
    let lastPaint = 0;
    try {
      videoItem.video = await processVideo(videoItem.file, (ratio) => {
        videoItem.progress = ratio;
        if (Date.now() - lastPaint > 500) {
          lastPaint = Date.now();
          renderMedia();
        }
      }, videoAbort.signal);
      videoItem.previewUrl = URL.createObjectURL(videoItem.video.poster.blob);
      videoItem.state = 'ready';
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      videoItem.state = 'error';
      videoItem.error = (err as Error).message || 'No se pudo procesar el video';
    }
    if (items.includes(videoItem)) renderMedia();
  }
  await Promise.all(workers);
}

function mediaAction(action: string, key: string) {
  const item = items.find((i) => i.key === key);
  if (!item) return;
  if (action === 'remove') {
    if (item.kind === 'video') videoAbort?.abort();
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    items = items.filter((i) => i !== item);
  } else {
    const images = items.filter((i) => i.kind === 'image');
    const from = images.indexOf(item);
    const to = action === 'left' ? from - 1 : from + 1;
    if (to < 0 || to >= images.length) return;
    [images[from], images[to]] = [images[to], images[from]];
    items = [...images, ...items.filter((i) => i.kind === 'video')];
  }
  renderMedia();
}

function setProgress(ratio: number | null, label = '') {
  $('gallery-progress')!.hidden = ratio === null;
  if (ratio !== null) {
    $('gallery-progress-bar')!.style.width = `${Math.round(ratio * 100)}%`;
    $('gallery-progress-label')!.textContent = label;
  }
}

async function submit(e: Event) {
  e.preventDefault();
  if (saving) return;
  const form = e.currentTarget as HTMLFormElement;
  const noticeEl = $('gallery-edit-notice');

  if (items.some((i) => i.state === 'processing')) {
    notice(noticeEl, 'info', 'Espera a que terminen de optimizarse los archivos.');
    return;
  }
  const ready = items.filter((i) => i.state === 'ready');
  if (items.some((i) => i.state === 'error')) {
    notice(noticeEl, 'warning', 'Quita los archivos con error antes de guardar.');
    return;
  }
  if (!editing && !ready.length) {
    notice(noticeEl, 'warning', 'Añade al menos una foto o un video.');
    return;
  }

  const fd = new FormData(form);
  const payload: Record<string, unknown> = {
    id: editing?.id,
    caption: fd.get('caption'),
    status: fd.get('status'),
    published_date: fd.get('published_date'),
    author: fd.get('author'),
    permalink: fd.get('permalink'),
  };

  saving = true;
  const button = $('gallery-submit') as HTMLButtonElement;
  try {
    await withBusy(button, async () => {
      if (ready.length) {
        // Subida secuencial con progreso total por bytes
        type UploadJob = { blob: Blob; kind: 'image' | 'poster' | 'video' };
        const jobs: UploadJob[] = ready.flatMap((i): UploadJob[] => i.kind === 'video'
          ? [{ blob: i.video!.blob, kind: 'video' }, { blob: i.video!.poster.blob, kind: 'poster' }]
          : [{ blob: i.image!.blob, kind: 'image' }]);
        const totalBytes = jobs.reduce((s, j) => s + j.blob.size, 0);
        let doneBytes = 0;
        const images: string[] = [];

        for (const job of jobs) {
          const id = await uploadInChunks(job.blob, job.kind, (r) => {
            setProgress((doneBytes + job.blob.size * r) / totalBytes, `Subiendo ${formatBytes(doneBytes + job.blob.size * r)} de ${formatBytes(totalBytes)}`);
          });
          doneBytes += job.blob.size;
          if (job.kind === 'image') images.push(id);
          if (job.kind === 'video') payload.video = id;
          if (job.kind === 'poster') payload.poster = id;
        }
        if (images.length) payload.images = images;
      }

      setProgress(1, 'Guardando…');
      const res = await api<{ post: GalleryPost }>('/api/gallery.php?action=save', payload);
      if (!res.ok) {
        showFieldErrors(form, res.data.validation_errors);
        throw new Error(res.data.error || 'No se pudo guardar la publicación.');
      }

      const message = res.data.message || 'Publicación guardada.';
      resetItems();
      await loadPosts();
      window.switchView('gallery');
      notice($('gallery-notice'), 'success', message);
    });
  } catch (err) {
    setProgress(null);
    notice(noticeEl, 'error', (err as Error).message);
  } finally {
    saving = false;
  }
}

function updateCaptionCount() {
  $('gf-caption-count')!.textContent = String(($('gf-caption') as HTMLTextAreaElement).value.length);
}

export function initGallery() {
  if (!$('view-gallery')) return;

  document.addEventListener('bm:session', (e) => (session = (e as CustomEvent<SessionUser>).detail));
  document.addEventListener('bm:view', (e) => {
    const view = (e as CustomEvent<string>).detail;
    if (view === 'gallery') {
      if (!saving) resetItems();
      loadPosts();
    }
    if (view === 'gallery-edit') prepareEditor();
  });

  $('gallery-status-filter')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-gallery-filter]');
    if (!link) return;
    e.preventDefault();
    filter = link.dataset.galleryFilter as typeof filter;
    renderList();
  });

  $('gallery-table-body')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!link) return;
    e.preventDefault();
    const post = posts.find((p) => p.id === link.closest<HTMLElement>('tr')?.dataset.postId);
    if (post) rowAction(link.dataset.action!, post);
  });

  const input = $('gallery-file-input') as HTMLInputElement;
  input.addEventListener('change', () => {
    if (input.files?.length) addFiles(input.files);
    input.value = '';
  });

  const zone = $('gallery-drop-zone')!;
  ['dragenter', 'dragover'].forEach((type) => zone.addEventListener(type, (e) => {
    e.preventDefault();
    zone.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((type) => zone.addEventListener(type, () => zone.classList.remove('is-dragging')));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    if ((e as DragEvent).dataTransfer?.files.length) addFiles((e as DragEvent).dataTransfer!.files);
  });

  $('gallery-media-list')!.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-media-action]');
    const key = button?.closest<HTMLElement>('[data-key]')?.dataset.key;
    if (button && key) mediaAction(button.dataset.mediaAction!, key);
  });

  $('gf-caption')!.addEventListener('input', updateCaptionCount);
  $('gallery-form')!.addEventListener('submit', submit);
  $('gallery-cancel')!.addEventListener('click', () => {
    if (items.length && !confirm('¿Descartar los archivos añadidos?')) return;
    resetItems();
    window.switchView('gallery');
  });

  // Aviso al cerrar la pestaña con una subida o compresión en curso
  window.addEventListener('beforeunload', (e) => {
    if (saving || items.some((i) => i.state === 'processing')) e.preventDefault();
  });
}
