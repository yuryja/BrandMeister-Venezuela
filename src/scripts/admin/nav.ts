// Panel · Navegación lateral
//  - Submenús plegados por defecto; se despliegan con su botón y se recuerda cuáles quedaron abiertos
//  - Al entrar en una sub-vista (p. ej. "Añadir nuevo") se abre su grupo automáticamente
//  - En pantallas pequeñas el menú es un cajón que se abre con el botón de la barra superior

const MOBILE_QUERY = window.matchMedia('(max-width: 900px)');
const STORAGE_KEY = 'bm-panel-submenus-abiertos';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

function readOpenGroups(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter((v) => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveOpenGroups(groups: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...groups]));
  } catch {
    /* Sin almacenamiento (modo privado): el estado dura solo esta visita */
  }
}

function setGroupOpen(toggle: HTMLButtonElement, open: boolean) {
  const submenu = document.getElementById(toggle.getAttribute('aria-controls') || '');
  if (!submenu) return;
  submenu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.closest('.has-submenu')?.classList.toggle('is-open', open);
}

// ---------------------------------------------------------------------------
// Cajón móvil
// ---------------------------------------------------------------------------
function setDrawer(open: boolean) {
  const sidebar = $('wp-sidebar');
  const backdrop = $('wp-sidebar-backdrop');
  const button = $('btn-menu-toggle');
  if (!sidebar || !backdrop || !button) return;

  const active = open && MOBILE_QUERY.matches;
  sidebar.classList.toggle('is-open', active);
  backdrop.hidden = !active;
  button.setAttribute('aria-expanded', String(active));
  button.setAttribute('aria-label', active ? 'Cerrar menú' : 'Abrir menú');
  document.body.classList.toggle('panel-menu-abierto', active);

  if (active) {
    sidebar.querySelector<HTMLElement>('.menu-link.is-active, .menu-link')?.focus();
  }
}

export function initNav() {
  const sidebar = $('wp-sidebar');
  if (!sidebar) return;

  const openGroups = readOpenGroups();
  const toggles = Array.from(sidebar.querySelectorAll<HTMLButtonElement>('.submenu-toggle'));

  toggles.forEach((toggle) => {
    const id = toggle.getAttribute('aria-controls') || '';
    setGroupOpen(toggle, openGroups.has(id));

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      setGroupOpen(toggle, open);
      if (open) openGroups.add(id);
      else openGroups.delete(id);
      saveOpenGroups(openGroups);
    });
  });

  // Al cambiar de vista: abrir el grupo de la sub-vista activa y cerrar el cajón en móvil
  document.addEventListener('bm:view', (e) => {
    const view = (e as CustomEvent<string>).detail;
    const sublink = sidebar.querySelector<HTMLElement>(`.submenu-link[data-view="${CSS.escape(view)}"]`);
    // Enlace principal visible con esa vista (p. ej. "Perfil" para quien no es Administrador)
    const parentView = Array.from(sidebar.querySelectorAll<HTMLElement>(`.menu-link[data-view="${CSS.escape(view)}"]`))
      .find((link) => (link.closest('.wp-menu-item') as HTMLElement | null)?.style.display !== 'none');
    // Solo se despliega si la vista vive dentro del submenú (no si es la vista principal del grupo)
    if (sublink && !parentView) {
      const toggle = sublink.closest('.has-submenu')?.querySelector<HTMLButtonElement>('.submenu-toggle');
      if (toggle && toggle.getAttribute('aria-expanded') !== 'true') {
        setGroupOpen(toggle, true);
        openGroups.add(toggle.getAttribute('aria-controls') || '');
        saveOpenGroups(openGroups);
      }
    }
    setDrawer(false);
  });

  $('btn-menu-toggle')?.addEventListener('click', () => {
    setDrawer(!sidebar.classList.contains('is-open'));
  });
  $('wp-sidebar-backdrop')?.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      setDrawer(false);
      $('btn-menu-toggle')?.focus();
    }
  });
  // Si se agranda la ventana con el cajón abierto, se cierra
  MOBILE_QUERY.addEventListener('change', () => setDrawer(false));
}
