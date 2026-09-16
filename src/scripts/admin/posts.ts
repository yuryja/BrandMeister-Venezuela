// Panel · Noticias: listado con filtros, papelera y editor con vista previa
import { api, escapeHtml, notice, showFieldErrors, withBusy, type SessionUser } from './api';
import { processImage, uploadInChunks, formatBytes, POST_IMAGE_MAX, type ProcessedImage } from './media';

type PostRow = {
  id: number;
  title: string;
  slug: string;
  description: string;
  content?: string;
  category: string;
  tags: string[];
  read_time: string;
  featured: boolean;
  status: 'published' | 'draft' | 'trash';
  author_id: number;
  author_name: string;
  author_callsign: string;
  views_count: number;
  image_url: string;
  published_ts: number;
  url: string;
};

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

let session: SessionUser | null = null;
let posts: PostRow[] = [];
let categories: string[] = [];
let counts = { published: 0, draft: 0, trash: 0 };
let canPublish = true;
let filter: 'all' | 'published' | 'draft' | 'trash' = 'all';
let search = '';
let editing: PostRow | null = null;
let pendingEdit: PostRow | null | 'new' = null;
let searchTimer = 0;
// Imagen destacada pendiente de subir y marca de "quitar la actual"
let imagenNueva: ProcessedImage | null = null;
let imagenPreviewUrl = '';
let quitarImagen = false;

const STATUS_LABELS = { published: 'Publicada', draft: 'Borrador', trash: 'Papelera' };
const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' });
const isoDate = (ts: number) => {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Listado
// ---------------------------------------------------------------------------
async function loadPosts() {
  const params = new URLSearchParams({ scope: 'admin', status: filter });
  if (search.trim()) params.set('search', search.trim());
  const res = await api<{ posts: PostRow[]; counts: typeof counts; categories: string[]; can_publish: boolean }>(`/api/posts.php?${params}`);
  if (!res.ok) {
    if (res.status !== 401) notice($('posts-notice'), 'error', res.data.error || 'No se pudieron cargar las noticias.');
    return;
  }
  posts = res.data.posts;
  counts = res.data.counts;
  // Contador del menú lateral (publicadas + borradores)
  const pill = $('menu-posts-count');
  if (pill) {
    const total = counts.published + counts.draft;
    pill.textContent = String(total);
    pill.hidden = total === 0;
  }
  categories = res.data.categories;
  canPublish = res.data.can_publish;
  renderList();
}

function renderList() {
  const total = counts.published + counts.draft;
  const all = { all: total, ...counts };
  document.querySelectorAll<HTMLElement>('#posts-status-filter [data-count]').forEach((el) => {
    el.textContent = `(${all[el.dataset.count as keyof typeof all] ?? 0})`;
  });
  document.querySelectorAll<HTMLElement>('#posts-status-filter [data-post-filter]').forEach((el) => {
    el.classList.toggle('is-current', el.dataset.postFilter === filter);
  });
  $('posts-count')!.textContent = `${posts.length} ${posts.length === 1 ? 'elemento' : 'elementos'}`;
  ($('posts-select-all') as HTMLInputElement).checked = false;

  const tbody = $('posts-table-body')!;
  if (!posts.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">${search ? 'Ninguna noticia coincide con la búsqueda.' : 'No hay noticias en este filtro.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = posts.map((p) => {
    const inTrash = p.status === 'trash';
    const actions = inTrash
      ? [`<span><a href="#" data-action="restore">Restaurar</a></span>`,
         canPublish ? `<span class="trash"><a href="#" data-action="delete">Eliminar definitivamente</a></span>` : '']
      : [`<span><a href="#" data-action="edit">Editar</a></span>`,
         p.status === 'published' ? `<span><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Ver</a></span>` : '',
         canPublish ? `<span><a href="#" data-action="${p.status === 'published' ? 'draft' : 'publish'}">${p.status === 'published' ? 'Pasar a borrador' : 'Publicar'}</a></span>` : '',
         `<span class="trash"><a href="#" data-action="trash">Papelera</a></span>`];

    return `
      <tr data-post-id="${p.id}" class="${p.status !== 'published' ? 'is-inactive' : ''}">
        <td class="col-cb"><input type="checkbox" class="post-cb" value="${p.id}" aria-label="Seleccionar ${escapeHtml(p.title)}" /></td>
        <td class="cell-title">
          ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="" loading="lazy" class="post-thumb" />` : ''}
          <strong>${inTrash ? escapeHtml(p.title) : `<a href="#" data-action="edit">${escapeHtml(p.title)}</a>`}</strong>
          ${p.status !== 'published' ? `<span class="state-badge state-${p.status === 'draft' ? 'pending' : 'inactive'}">${STATUS_LABELS[p.status]}</span>` : ''}
          ${p.featured ? '<span class="state-badge state-self">Destacada</span>' : ''}
          <p class="post-excerpt">${escapeHtml(p.description.length > 120 ? p.description.slice(0, 120) + '…' : p.description)}</p>
          <div class="row-actions">${actions.filter(Boolean).join(' | ')}</div>
        </td>
        <td>${escapeHtml(p.author_callsign || p.author_name)}</td>
        <td><span class="cat-pill-mini">${escapeHtml(p.category)}</span></td>
        <td class="post-tags">${p.tags.map((t) => `<span class="tag-label">#${escapeHtml(t)}</span>`).join(' ') || '<span class="text-faint">—</span>'}</td>
        <td class="col-num">${p.views_count}</td>
        <td>${fmtDate(p.published_ts)}</td>
      </tr>`;
  }).join('');
}

async function rowAction(action: string, post: PostRow) {
  if (action === 'edit') {
    pendingEdit = post;
    window.switchView('new-post');
    return;
  }
  if (action === 'delete') {
    if (!confirm(`¿Eliminar definitivamente "${post.title}"? No se puede deshacer.`)) return;
    const res = await api('/api/posts.php?action=delete', { id: post.id });
    notice($('posts-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo eliminar.');
    if (res.ok) loadPosts();
    return;
  }
  const statusMap: Record<string, string> = { publish: 'published', draft: 'draft', trash: 'trash', restore: 'draft' };
  const res = await api('/api/posts.php?action=status', { id: post.id, status: statusMap[action] });
  notice($('posts-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo cambiar el estado.');
  if (res.ok) loadPosts();
}

async function applyBulk() {
  const operation = ($('posts-bulk-action') as HTMLSelectElement).value;
  const ids = Array.from(document.querySelectorAll<HTMLInputElement>('.post-cb:checked')).map((cb) => Number(cb.value));
  if (!operation) return notice($('posts-notice'), 'info', 'Elige una acción en lote.');
  if (!ids.length) return notice($('posts-notice'), 'info', 'Selecciona al menos una noticia.');
  if (operation === 'delete' && !confirm(`¿Eliminar definitivamente ${ids.length} noticia(s)?`)) return;

  const res = await api('/api/posts.php?action=bulk', { operation, ids });
  notice($('posts-notice'), res.ok ? 'success' : 'error', res.data.message || res.data.error || 'No se pudo aplicar.');
  if (res.ok) {
    ($('posts-bulk-action') as HTMLSelectElement).value = '';
    loadPosts();
  }
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180);
}

async function prepareEditor() {
  const target = pendingEdit;
  pendingEdit = null;
  const form = $('post-form') as HTMLFormElement;
  form.reset();
  showFieldErrors(form);
  $('post-form-notice')!.innerHTML = '';
  $('pf-preview')!.style.display = 'none';

  // Al editar se pide el contenido completo
  editing = null;
  if (target && target !== 'new') {
    const res = await api<{ post: PostRow }>(`/api/posts.php?scope=admin&id=${target.id}`);
    if (!res.ok) {
      notice($('post-form-notice'), 'error', res.data.error || 'No se pudo abrir la noticia.');
      return;
    }
    editing = res.data.post;
  }

  const set = (name: string, value: string) => ((form.elements.namedItem(name) as HTMLInputElement).value = value);
  set('id', editing ? String(editing.id) : '');
  set('title', editing?.title ?? '');
  set('slug', editing?.slug ?? '');
  set('description', editing?.description ?? '');
  set('content', editing?.content ?? '');
  set('tags', editing?.tags.join(', ') ?? '');
  set('read_time', editing?.read_time ?? '');
  set('published_date', editing ? isoDate(editing.published_ts) : isoDate(Date.now() / 1000));
  ($('pf-featured') as HTMLInputElement).checked = editing?.featured ?? false;

  const status = $('pf-status') as HTMLSelectElement;
  status.innerHTML = `<option value="draft">Borrador</option>${canPublish ? '<option value="published">Publicada</option>' : ''}`;
  status.value = editing && (editing.status !== 'trash') ? editing.status : 'draft';
  $('pf-author-hint')!.hidden = canPublish;

  $('pf-categories')!.innerHTML = categories.map((cat) => `
    <label class="checkbox-inline">
      <input type="radio" name="category" value="${escapeHtml(cat)}" ${((editing?.category ?? 'General') === cat) ? 'checked' : ''} />
      ${escapeHtml(cat)}
    </label>`).join('');

  $('pf-author')!.textContent = editing ? (editing.author_callsign || editing.author_name) : (session?.callsign ?? '');
  $('post-form-title')!.textContent = editing ? 'Editar noticia' : 'Añadir nueva noticia';
  $('post-submit')!.textContent = editing ? 'Actualizar' : 'Guardar';

  const view = $('pf-view-link') as HTMLAnchorElement;
  view.hidden = !editing || editing.status !== 'published';
  if (editing) view.href = editing.url;

  limpiarImagen();
  pintarImagen();
  updateCounters();
  ($('pf-title') as HTMLInputElement).focus();
}

function limpiarImagen() {
  if (imagenPreviewUrl) URL.revokeObjectURL(imagenPreviewUrl);
  imagenPreviewUrl = '';
  imagenNueva = null;
  quitarImagen = false;
}

function pintarImagen() {
  const preview = $('pf-image-preview')!;
  const thumb = $('pf-image-thumb') as HTMLImageElement;
  const info = $('pf-image-info')!;
  const actual = !quitarImagen && editing?.image_url ? editing.image_url : '';

  if (imagenNueva) {
    thumb.src = imagenPreviewUrl;
    const ahorro = Math.max(0, Math.round((1 - imagenNueva.blob.size / imagenNueva.originalBytes) * 100));
    info.textContent = `${imagenNueva.width}×${imagenNueva.height} · ${formatBytes(imagenNueva.blob.size)}${ahorro ? ` · −${ahorro}%` : ''} · se sube al guardar`;
    preview.hidden = false;
  } else if (actual) {
    thumb.src = actual;
    info.textContent = 'Imagen actual de la noticia';
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }
}

async function procesarImagen(file: File) {
  const info = $('pf-image-info')!;
  $('pf-image-preview')!.hidden = false;
  info.textContent = 'Optimizando imagen…';
  try {
    const procesada = await processImage(file, {
      maxWidth: POST_IMAGE_MAX.width,
      maxHeight: POST_IMAGE_MAX.height,
      mode: 'ultra',
    });
    limpiarImagen();
    imagenNueva = procesada;
    imagenPreviewUrl = URL.createObjectURL(procesada.blob);
  } catch {
    notice($('post-form-notice'), 'error', /hei[cf]$/i.test(file.name)
      ? 'HEIC solo se puede leer en Safari: conviértela a JPG antes de subirla.'
      : 'No se pudo leer esa imagen.');
  }
  pintarImagen();
}

function updateCounters() {
  const content = ($('pf-content') as HTMLTextAreaElement).value;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  $('pf-content-stats')!.textContent = `${words} palabras · ${Math.max(1, Math.round(words / 200))} min de lectura aprox.`;
  $('pf-description-count')!.textContent = String(($('pf-description') as HTMLTextAreaElement).value.length);
}

/** Vista previa del Markdown (la versión definitiva la genera PHP al publicar) */
function markdownToHtml(md: string) {
  const inline = (text: string) =>
    escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => `<a href="${escapeHtml(url)}">${label}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, '<em>$1</em>');

  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  const closeList = () => {
    if (list) html.push(`</${list}>`);
    list = null;
  };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^[-*+]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (heading) { closeList(); const l = Math.min(6, Math.max(2, heading[1].length)); html.push(`<h${l}>${inline(heading[2])}</h${l}>`); }
    else if (/^(-{3,}|\*{3,})$/.test(line)) { closeList(); html.push('<hr />'); }
    else if (quote) { closeList(); html.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`); }
    else if (bullet) { if (list !== 'ul') { closeList(); html.push('<ul>'); list = 'ul'; } html.push(`<li>${inline(bullet[1])}</li>`); }
    else if (numbered) { if (list !== 'ol') { closeList(); html.push('<ol>'); list = 'ol'; } html.push(`<li>${inline(numbered[1])}</li>`); }
    else { closeList(); html.push(`<p>${inline(line)}</p>`); }
  }
  closeList();
  return html.join('\n');
}

/** Inserta formato Markdown alrededor de la selección */
function applyFormat(kind: string) {
  const area = $('pf-content') as HTMLTextAreaElement;
  const { selectionStart: start, selectionEnd: end, value } = area;
  const selected = value.slice(start, end);
  const wrappers: Record<string, [string, string]> = {
    bold: ['**', '**'],
    italic: ['*', '*'],
    h2: ['\n## ', '\n'],
    h3: ['\n### ', '\n'],
    quote: ['\n> ', '\n'],
    link: ['[', '](https://)'],
  };
  let replacement: string;
  if (kind === 'ul' || kind === 'ol') {
    const lines = (selected || 'Elemento').split('\n');
    replacement = '\n' + lines.map((l, i) => (kind === 'ul' ? `- ${l}` : `${i + 1}. ${l}`)).join('\n') + '\n';
  } else {
    const [before, after] = wrappers[kind] ?? ['', ''];
    replacement = before + (selected || (kind === 'link' ? 'texto del enlace' : 'texto')) + after;
  }
  area.setRangeText(replacement, start, end, 'end');
  area.focus();
  updateCounters();
}

async function submit(e: Event) {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const fd = new FormData(form);
  const payload = {
    id: editing?.id,
    title: fd.get('title'),
    slug: fd.get('slug'),
    description: fd.get('description'),
    content: fd.get('content'),
    category: fd.get('category') || 'General',
    tags: fd.get('tags'),
    read_time: fd.get('read_time'),
    featured: ($('pf-featured') as HTMLInputElement).checked,
    status: fd.get('status'),
    published_date: fd.get('published_date'),
  };

  const res = await withBusy($('post-submit') as HTMLButtonElement, async () => {
    if (imagenNueva) {
      $('pf-image-info')!.textContent = 'Subiendo imagen…';
      const uploadId = await uploadInChunks(imagenNueva.blob, 'post-image', undefined, '/api/posts.php?action=upload_chunk');
      (payload as Record<string, unknown>).image = uploadId;
    } else if (quitarImagen) {
      (payload as Record<string, unknown>).remove_image = true;
    }
    return api<{ post: PostRow }>('/api/posts.php?action=save', payload);
  });
  if (!res.ok) {
    showFieldErrors(form, res.data.validation_errors);
    notice($('post-form-notice'), 'error', res.data.error || 'No se pudo guardar la noticia.');
    return;
  }
  const message = res.data.message || 'Noticia guardada.';
  limpiarImagen();
  await loadPosts();
  window.switchView('posts');
  notice($('posts-notice'), 'success', message);
}

export function initPosts() {
  if (!$('view-posts')) return;

  document.addEventListener('bm:session', (e) => (session = (e as CustomEvent<SessionUser>).detail));
  document.addEventListener('bm:view', (e) => {
    const view = (e as CustomEvent<string>).detail;
    if (view === 'posts') loadPosts();
    if (view === 'new-post') prepareEditor();
  });

  $('posts-status-filter')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-post-filter]');
    if (!link) return;
    e.preventDefault();
    filter = link.dataset.postFilter as typeof filter;
    loadPosts();
  });

  $('posts-search')!.addEventListener('input', (e) => {
    search = (e.target as HTMLInputElement).value;
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(loadPosts, 300);
  });

  $('posts-select-all')!.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    document.querySelectorAll<HTMLInputElement>('.post-cb').forEach((cb) => (cb.checked = checked));
  });

  $('posts-table-body')!.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!link) return;
    e.preventDefault();
    const post = posts.find((p) => p.id === Number(link.closest<HTMLElement>('tr')?.dataset.postId));
    if (post) rowAction(link.dataset.action!, post);
  });

  $('posts-bulk-apply')!.addEventListener('click', applyBulk);

  // Borrador rápido del Escritorio
  $('quick-draft-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const title = ($('qd-title') as HTMLInputElement).value.trim();
    const content = ($('qd-content') as HTMLTextAreaElement).value.trim();
    const res = await api('/api/posts.php?action=save', {
      title,
      content,
      // El resumen se puede afinar luego en el editor
      description: content.slice(0, 300),
      status: 'draft',
      category: 'General',
    });
    if (!res.ok) {
      const detalle = Object.values(res.data.validation_errors ?? {})[0];
      alert(detalle || res.data.error || 'No se pudo guardar el borrador.');
      return;
    }
    form.reset();
    window.switchView('posts');
    notice($('posts-notice'), 'success', 'Borrador guardado. Ábrelo para completarlo y publicarlo.');
  });
  $('post-form')!.addEventListener('submit', submit);

  // El slug se genera desde el título mientras no se toque a mano
  const slugInput = $('pf-slug') as HTMLInputElement;
  let slugTouched = false;
  slugInput.addEventListener('input', () => (slugTouched = true));
  $('pf-title')!.addEventListener('input', (e) => {
    if (!slugTouched && !editing) slugInput.value = slugify((e.target as HTMLInputElement).value);
  });

  const imageInput = $('pf-image-input') as HTMLInputElement;
  imageInput.addEventListener('change', () => {
    if (imageInput.files?.[0]) procesarImagen(imageInput.files[0]);
    imageInput.value = '';
  });
  const imageDrop = $('pf-image-drop')!;
  ['dragenter', 'dragover'].forEach((tipo) => imageDrop.addEventListener(tipo, (e) => {
    e.preventDefault();
    imageDrop.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((tipo) => imageDrop.addEventListener(tipo, () => imageDrop.classList.remove('is-dragging')));
  imageDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = (e as DragEvent).dataTransfer?.files?.[0];
    if (file) procesarImagen(file);
  });
  $('pf-image-remove')!.addEventListener('click', () => {
    limpiarImagen();
    quitarImagen = true;
    pintarImagen();
  });

  $('pf-content')!.addEventListener('input', updateCounters);
  $('pf-description')!.addEventListener('input', updateCounters);
  document.querySelectorAll<HTMLElement>('[data-md]').forEach((btn) =>
    btn.addEventListener('click', () => applyFormat(btn.dataset.md!))
  );
  $('pf-preview-toggle')!.addEventListener('click', () => {
    const box = $('pf-preview')!;
    const area = $('pf-content') as HTMLTextAreaElement;
    const showing = box.style.display !== 'none';
    box.style.display = showing ? 'none' : 'block';
    area.style.display = showing ? 'block' : 'none';
    if (!showing) box.innerHTML = `<div class="prose-preview">${markdownToHtml(area.value)}</div>`;
  });
}
