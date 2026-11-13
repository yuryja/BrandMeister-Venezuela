// Módulo de administración para Preguntas Frecuentes (FAQ)
// Permite edición en lote en Markdown, vista previa interactiva y sincronización con MySQL

import { api, notice, escapeHtml } from './api';

let loadedMarkdown = '';
let isSaving = false;

// Element helper
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

interface ParsedFaqItem {
  category: string;
  question: string;
  answerMd: string;
}

/**
 * Parsea el texto Markdown actual en una lista de objetos agrupados
 */
function parseMarkdownToFaqs(md: string): ParsedFaqItem[] {
  const lines = md.split(/\r?\n/);
  const items: ParsedFaqItem[] = [];
  let currentCat = 'General';
  let currentQ = '';
  let currentAnswerLines: string[] = [];

  const flush = () => {
    if (currentQ) {
      items.push({
        category: currentCat,
        question: currentQ,
        answerMd: currentAnswerLines.join('\n').trim(),
      });
      currentQ = '';
      currentAnswerLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flush();
      currentCat = trimmed.substring(3).trim();
    } else if (trimmed.startsWith('### ')) {
      flush();
      currentQ = trimmed.substring(4).trim();
    } else if (currentQ) {
      currentAnswerLines.push(line);
    }
  }
  flush();

  return items;
}

/**
 * Convierte Markdown básico a HTML para la vista previa en vivo
 */
function simpleMarkdownToHtml(md: string): string {
  // Escapar HTML base para evitar inyecciones
  let html = escapeHtml(md);

  // Bloques de código pre
  html = html.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Código en línea
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Negrita
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Cursiva
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Enlaces
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Listas con guiones
  const lines = html.split('\n');
  let inList = false;
  const processedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        processedLines.push('');
      } else {
        processedLines.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) processedLines.push('</ul>');

  return processedLines.join('\n');
}

/**
 * Actualiza los contadores en la barra superior
 */
function updateStatsFromText(md: string) {
  const items = parseMarkdownToFaqs(md);
  const categories = new Set(items.map((i) => i.category));

  const countVal = $('faqs-count-val');
  if (countVal) countVal.textContent = String(items.length);

  const catsVal = $('faqs-cats-val');
  if (catsVal) catsVal.textContent = String(categories.size);

  const charCount = $('faqs-char-count');
  if (charCount) charCount.textContent = `${md.length.toLocaleString('es-VE')} caracteres · ${items.length} preguntas`;
}

/**
 * Genera la vista previa interactiva a partir del texto actual
 */
function renderPreview(md: string) {
  const container = $('faqs-preview-body');
  if (!container) return;

  const items = parseMarkdownToFaqs(md);
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No se detectaron preguntas en el Markdown. Usa <code>## Categoría</code> y <code>### Pregunta</code>.</p>';
    return;
  }

  // Agrupar por categoría
  const groups = new Map<string, ParsedFaqItem[]>();
  for (const item of items) {
    if (!groups.has(item.category)) {
      groups.set(item.category, []);
    }
    groups.get(item.category)!.push(item);
  }

  let html = '';
  for (const [catName, catItems] of groups.entries()) {
    html += `
      <div class="faqs-preview-group">
        <h3 class="faqs-preview-cat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          ${escapeHtml(catName)} (${catItems.length})
        </h3>
        <div class="faqs-preview-items">
    `;

    for (const item of catItems) {
      const isInternetQ = item.question.toLowerCase().includes('internet');
      html += `
        <details class="faqs-preview-accordion"${isInternetQ ? ' open' : ''}>
          <summary class="faqs-preview-question">
            <span>${escapeHtml(item.question)}</span>
            ${isInternetQ ? '<span style="font-size: 0.72rem; background: #fee2e2; color: #dc2626; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">Destacada</span>' : ''}
          </summary>
          <div class="faqs-preview-answer">
            ${simpleMarkdownToHtml(item.answerMd)}
          </div>
        </details>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Genera la tabla resumen a partir del texto actual
 */
function renderTable(md: string) {
  const tbody = $('faqs-table-body');
  if (!tbody) return;

  const items = parseMarkdownToFaqs(md);
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-empty" style="text-align:center; padding:2rem; color:var(--text-muted);">Sin preguntas detectadas en el editor.</td></tr>';
    return;
  }

  let html = '';
  items.forEach((item, idx) => {
    html += `
      <tr>
        <td style="font-weight: 700; color: var(--text-faint);">${idx + 1}</td>
        <td><span class="cat-pill-mini">${escapeHtml(item.category)}</span></td>
        <td>
          <strong>${escapeHtml(item.question)}</strong>
          <div class="row-actions" style="margin-top: 0.2rem; font-size: 0.8rem; color: var(--text-muted);">
            ${escapeHtml(item.answerMd.substring(0, 90))}…
          </div>
        </td>
        <td style="text-align: center; font-size: 0.8rem; color: var(--text-muted);">${item.answerMd.length} caracteres</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Carga las FAQs desde la API
 */
async function loadFaqs() {
  const textarea = $('faqs-markdown-input') as HTMLTextAreaElement | null;
  const dbBadge = $('faqs-db-badge');

  try {
    const res = await api<{
      from_db?: boolean;
      total?: number;
      categories?: string[];
      raw_md?: string;
    }>('/api/faqs.php');

    if (res.ok && res.data) {
      loadedMarkdown = res.data.raw_md || '';
      if (textarea) {
        textarea.value = loadedMarkdown;
      }
      updateStatsFromText(loadedMarkdown);
      renderPreview(loadedMarkdown);
      renderTable(loadedMarkdown);

      if (dbBadge) {
        if (res.data.from_db) {
          dbBadge.className = 'faqs-stat-pill is-live';
          dbBadge.innerHTML = '<span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Sincronizado con MySQL';
        } else {
          dbBadge.className = 'faqs-stat-pill';
          dbBadge.innerHTML = '<span style="width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span> Modo Respaldo Local';
        }
      }
    } else {
      notice($('faqs-notice'), 'error', res.data?.error || 'No fue posible cargar las preguntas frecuentes.');
    }
  } catch (err) {
    notice($('faqs-notice'), 'error', 'Error al consultar la API de FAQs.');
  }
}

/**
 * Guarda el documento Markdown completo en MySQL
 */
async function saveFaqs() {
  if (isSaving) return;
  const textarea = $('faqs-markdown-input') as HTMLTextAreaElement | null;
  const saveBtn = $('btn-save-faqs') as HTMLButtonElement | null;
  if (!textarea) return;

  const md = textarea.value.trim();
  if (!md) {
    notice($('faqs-notice'), 'warning', 'El contenido no puede estar vacío.');
    return;
  }

  const items = parseMarkdownToFaqs(md);
  if (items.length === 0) {
    notice($('faqs-notice'), 'error', 'No se detectaron preguntas válidas. Usa "## Categoría" y "### Pregunta".');
    return;
  }

  isSaving = true;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando…';
  }

  try {
    const res = await api<{ message?: string; count?: number }>('/api/faqs.php?action=save_all_md', { markdown: md }, 'POST');
    if (res.ok && res.data?.success !== false) {
      loadedMarkdown = md;
      notice($('faqs-notice'), 'success', res.data?.message || `Guardadas exitosamente ${items.length} preguntas frecuentes.`);
      await loadFaqs();
    } else {
      notice($('faqs-notice'), 'error', res.data?.error || 'Error al guardar las preguntas frecuentes.');
    }
  } catch (err) {
    notice($('faqs-notice'), 'error', 'Fallo de conexión al guardar.');
  } finally {
    isSaving = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Cambios';
    }
  }
}

/**
 * Inserta texto en la posición del cursor de un textarea
 */
function insertTextAtCursor(textarea: HTMLTextAreaElement, before: string, after = '') {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selected = val.substring(start, end);

  const replacement = before + (selected || '') + after;
  textarea.value = val.substring(0, start) + replacement + val.substring(end);

  const newCursor = start + before.length + selected.length;
  textarea.focus();
  textarea.setSelectionRange(newCursor, newCursor);

  updateStatsFromText(textarea.value);
}

/**
 * Inicializa el módulo de administración de FAQs
 */
export function initFaqs() {
  const root = $('view-faqs');
  if (!root) return;

  const textarea = $('faqs-markdown-input') as HTMLTextAreaElement | null;

  // Escuchar cambio de vista en el panel
  document.addEventListener('bm:view', (e) => {
    const view = (e as CustomEvent<string>).detail;
    if (view === 'faqs') {
      loadFaqs();
    }
  });

  // Botón Guardar
  $('btn-save-faqs')?.addEventListener('click', saveFaqs);

  // Botón Recargar
  $('btn-reload-faqs')?.addEventListener('click', () => {
    if (confirm('¿Deseas recargar y descartar los cambios no guardados?')) {
      loadFaqs();
    }
  });

  // Conteo en vivo al escribir en el textarea
  if (textarea) {
    textarea.addEventListener('input', () => {
      updateStatsFromText(textarea.value);
    });

    // Soporte para tecla Tab (insertar 2 espacios en vez de perder foco)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        insertTextAtCursor(textarea, '  ');
      }
    });
  }

  // Pestañas (Editor / Vista Previa / Tabla)
  root.querySelectorAll<HTMLButtonElement>('[data-faq-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.faqTab;
      if (!tab) return;

      root.querySelectorAll('.faqs-tab-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const panelEditor = $('faqs-panel-editor');
      const panelPreview = $('faqs-panel-preview');
      const panelTable = $('faqs-panel-table');

      if (panelEditor) panelEditor.hidden = tab !== 'editor';
      if (panelPreview) {
        panelPreview.hidden = tab !== 'preview';
        if (tab === 'preview' && textarea) {
          renderPreview(textarea.value);
        }
      }
      if (panelTable) {
        panelTable.hidden = tab !== 'table';
        if (tab === 'table' && textarea) {
          renderTable(textarea.value);
        }
      }
    });
  });

  // Barra de herramientas Markdown
  root.querySelectorAll<HTMLButtonElement>('.faqs-toolbar-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!textarea) return;
      const action = btn.dataset.action;

      switch (action) {
        case 'insert-cat':
          insertTextAtCursor(textarea, '\n\n## Nueva Categoría\n\n');
          break;
        case 'insert-q':
          insertTextAtCursor(textarea, '\n\n### ¿Tu pregunta aquí?\n\nRespuesta clara y técnica en Markdown...\n\n');
          break;
        case 'bold':
          insertTextAtCursor(textarea, '**', '**');
          break;
        case 'italic':
          insertTextAtCursor(textarea, '*', '*');
          break;
        case 'list':
          insertTextAtCursor(textarea, '\n- Elemento 1\n- Elemento 2\n');
          break;
        case 'code':
          insertTextAtCursor(textarea, '`', '`');
          break;
        case 'link':
          insertTextAtCursor(textarea, '[texto del enlace](', ')');
          break;
        case 'copy-md':
          navigator.clipboard.writeText(textarea.value).then(() => {
            notice($('faqs-notice'), 'info', 'Markdown copiado al portapapeles.');
          });
          break;
        case 'download-md': {
          const blob = new Blob([textarea.value], { type: 'text/markdown;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `brandmeister-faqs-${new Date().toISOString().slice(0, 10)}.md`;
          a.click();
          URL.revokeObjectURL(url);
          break;
        }
      }
    });
  });
}
