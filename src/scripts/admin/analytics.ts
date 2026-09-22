// Panel · Analíticas y Telemetría del Escritorio
// Integración con Leaflet + Leaflet.markercluster y KPIs en tiempo real

import { escapeHtml } from './api';

declare const L: any;

interface MapPoint {
  lat: number;
  lng: number;
  city: string;
  country: string;
  code: string;
  count: number;
  events?: {
    player_play?: number;
    link_click?: number;
    post_view?: number;
    post_share?: number;
  };
}

interface AnalyticsData {
  kpis: {
    player_plays: number;
    unique_listeners: number;
    link_clicks: number;
    post_views: number;
    post_shares: number;
    petra_views?: number;
    petra_unique?: number;
    page_views?: number;
    unique_visitors?: number;
    active_countries: number;
  };
  traffic?: {
    sources: Array<{ key: string; name: string; visits: number; people: number; percent: number }>;
    sites: Array<{ host: string; source: string; visits: number; people: number }>;
    total_visits: number;
    page_views: number;
    unique_visitors: number;
  };
  map_points: MapPoint[];
  player: {
    countries: Array<{ country: string; code: string; plays: number; percent: number }>;
    listeners: Array<{ ip: string; country: string; code: string; city: string; plays: number; last_active: string; status: string }>;
    total_plays: number;
  };
  petra?: {
    total_views: number;
    unique_visitors: number;
    talkgroups: Array<{
      id: string;
      name: string;
      badge: string;
      sub?: string;
      views: number;
      unique_users: number;
      percent: number;
    }>;
  };
  live_audio?: {
    is_active: boolean;
    total_listeners: number;
    countries: Array<{ country: string; code: string; count: number }>;
  };
  countries_detail?: Array<{
    country: string;
    code: string;
    total: number;
    unique_visitors: number;
    percent: number;
    audio_plays: number;
    petra_views: number;
    post_views: number;
    link_clicks: number;
    last_active: string;
  }>;
  links: Array<{ title: string; url: string; category?: string; clicks: number }>;
  posts: Array<{ title: string; slug?: string; category: string; views: number; total_views?: number; shares?: number }>;
  shares: {
    platforms: Array<{ name: string; key?: string; shares: number; percent: number }>;
    total: number;
  };
}

let mapInstance: any = null;
let clusterGroup: any = null;
let currentData: AnalyticsData | null = null;
let currentFilter: string = 'all';
let currentRange: string = '7d';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

// Formateador numérico
const fmt = (n: number | undefined) => (n ?? 0).toLocaleString('es-VE');

// Bandera emoji aproximada según código ISO 2
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// --------------------------------------------------------------------
// Inicialización del Mapa Leaflet con Clusters
// --------------------------------------------------------------------
function initMap() {
  const container = $('analytics-leaflet-map');
  if (!container || typeof L === 'undefined') return;

  if (!mapInstance) {
    // Centrar en el norte de Sudamérica / Venezuela
    mapInstance = L.map('analytics-leaflet-map', {
      center: [8.5, -66.0],
      zoom: 5,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    // Control de zoom discreto en la esquina superior derecha
    L.control.zoom({ position: 'topright' }).addTo(mapInstance);

    // Capa de mapa 100% libre, abierta y sin necesidad de ninguna API key (OpenStreetMap)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Reanudar tamaño en redimensionamiento o scroll
    window.addEventListener('resize', () => {
      mapInstance?.invalidateSize();
    });
  }

  renderMarkers();
}

function renderMarkers() {
  if (!mapInstance || !currentData || typeof L === 'undefined') return;

  if (clusterGroup) {
    clusterGroup.clearLayers();
    mapInstance.removeLayer(clusterGroup);
  }

  // Agrupador de marcadores personalizado (MarkerCluster)
  if (typeof L.markerClusterGroup === 'function') {
    clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let sizeClass = 'bm-cluster-sm';
        let diameter = 36;
        if (count >= 25) {
          sizeClass = 'bm-cluster-lg';
          diameter = 48;
        } else if (count >= 10) {
          sizeClass = 'bm-cluster-md';
          diameter = 42;
        }

        return L.divIcon({
          html: `<span>${count}</span>`,
          className: `bm-custom-cluster ${sizeClass}`,
          iconSize: L.point(diameter, diameter),
        });
      },
    });
  }

  const points = currentData.map_points || [];

  points.forEach((pt) => {
    // Filtrar según botón seleccionado
    if (currentFilter !== 'all') {
      const eventCount = pt.events?.[currentFilter as keyof typeof pt.events] || 0;
      if (eventCount === 0) return;
    }

    const flag = getFlagEmoji(pt.code);
    const audioPlays = pt.events?.player_play || 0;
    const linkClicks = pt.events?.link_click || 0;
    const postViews = pt.events?.post_view || 0;

    const popupHtml = `
      <div class="bm-popup-card">
        <div class="bm-popup-header">
          <span>${flag}</span>
          <span>${escapeHtml(pt.city)}</span>
          <span class="bm-popup-badge">${escapeHtml(pt.country)}</span>
        </div>
        <div class="bm-popup-stat">
          <span>Total actividad:</span>
          <strong>${fmt(pt.count)} interacciones</strong>
        </div>
        ${audioPlays ? `<div class="bm-popup-stat"><span>Reproducciones</span><strong>${fmt(audioPlays)}</strong></div>` : ''}
        ${linkClicks ? `<div class="bm-popup-stat"><span>Clics en enlaces</span><strong>${fmt(linkClicks)}</strong></div>` : ''}
        ${postViews ? `<div class="bm-popup-stat"><span>Lecturas del blog</span><strong>${fmt(postViews)}</strong></div>` : ''}
      </div>
    `;

    const singleIcon = L.divIcon({
      className: 'bm-single-pin',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });

    const marker = L.marker([pt.lat, pt.lng], { icon: singleIcon }).bindPopup(popupHtml);

    if (clusterGroup) {
      clusterGroup.addLayer(marker);
    } else {
      marker.addTo(mapInstance);
    }
  });

  if (clusterGroup) {
    mapInstance.addLayer(clusterGroup);
  }
}

// --------------------------------------------------------------------
// Render de Widgets
// --------------------------------------------------------------------
function renderDashboard(data: AnalyticsData) {
  currentData = data;

  // 0. Banner de Oyentes en Vivo
  const liveBanner = $('live-listeners-banner');
  const liveText = $('live-listeners-text');
  if (liveBanner && liveText) {
    const live = data.live_audio;
    if (live && live.is_active && live.total_listeners > 0) {
      liveBanner.classList.add('is-active-listening');
      const count = live.total_listeners;
      const countLabel = count === 1 ? '1 usuario escuchando' : `${fmt(count)} usuarios escuchando`;
      const countriesList = (live.countries || [])
        .map((c) => {
          const flag = getFlagEmoji(c.code);
          return `<span class="live-country-pill">${flag} ${escapeHtml(c.country)} <strong>(${fmt(c.count)})</strong></span>`;
        })
        .join('');

      liveText.innerHTML = `Hay <strong>${countLabel}</strong> en este momento desde: <span class="live-status-countries-pills">${countriesList}</span>`;
    } else {
      liveBanner.classList.remove('is-active-listening');
      liveText.textContent = 'No hay personas escuchando el audio en vivo en este momento.';
    }
  }

  // 1. KPIs
  if ($('kpi-player-plays')) $('kpi-player-plays')!.textContent = fmt(data.kpis?.player_plays);
  if ($('kpi-unique-listeners')) $('kpi-unique-listeners')!.textContent = fmt(data.kpis?.unique_listeners);
  if ($('kpi-link-clicks')) $('kpi-link-clicks')!.textContent = fmt(data.kpis?.link_clicks);
  if ($('kpi-post-views')) $('kpi-post-views')!.textContent = fmt(data.kpis?.post_views);
  if ($('kpi-post-shares')) $('kpi-post-shares')!.textContent = fmt(data.kpis?.post_shares);
  if ($('kpi-active-countries')) $('kpi-active-countries')!.textContent = fmt(data.kpis?.active_countries);
  if ($('kpi-page-views')) $('kpi-page-views')!.textContent = fmt(data.kpis?.page_views ?? 0);
  if ($('kpi-unique-visitors')) $('kpi-unique-visitors')!.textContent = fmt(data.kpis?.unique_visitors ?? 0);
  if ($('kpi-petra-views')) $('kpi-petra-views')!.textContent = fmt(data.kpis?.petra_views ?? data.petra?.total_views ?? 0);
  if ($('kpi-petra-unique')) $('kpi-petra-unique')!.textContent = fmt(data.kpis?.petra_unique ?? data.petra?.unique_visitors ?? 0);

  // Países principales según las conexiones del periodo
  const topCountries = Array.from(new Set((data.map_points || []).map((p) => p.code).filter((c) => /^[A-Z]{2}$/.test(c)))).slice(0, 4);
  if ($('kpi-top-countries')) $('kpi-top-countries')!.textContent = topCountries.length ? topCountries.join(', ') : 'Sin datos aún';
  const topPlatform = (data.shares?.platforms || [])[0];
  if ($('kpi-top-platform')) $('kpi-top-platform')!.textContent = topPlatform ? `Más usado: ${topPlatform.name}` : 'Sin compartidos aún';
  const rangeLabels: Record<string, string> = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', all: 'Histórico' };
  document.querySelectorAll('[data-range-label]').forEach((el) => (el.textContent = rangeLabels[currentRange] ?? ''));

  // 2. Mapa
  renderMarkers();

  // 3. Reproductor: Países
  const countriesList = $('player-countries-list');
  if (countriesList) {
    const countries = data.player?.countries || [];
    if (!countries.length) {
      countriesList.innerHTML = '<p class="analytics-empty">Sin reproducciones en este periodo.</p>';
    } else {
      countriesList.innerHTML = countries
        .map((c) => {
          const flag = getFlagEmoji(c.code);
          return `
            <div class="country-bar-item">
              <div class="country-bar-header">
                <span class="country-name-wrap">
                  <span>${flag}</span>
                  <span>${escapeHtml(c.country)}</span>
                  <span class="country-code-pill">${escapeHtml(c.code)}</span>
                </span>
                <span class="country-bar-metrics">
                  <strong>${fmt(c.plays)}</strong>
                  <span>${Number(c.percent) || 0}%</span>
                </span>
              </div>
              <div class="country-bar-track">
                <div class="country-bar-fill" style="width: ${Math.max(0, Math.min(100, Number(c.percent) || 0))}%;"></div>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // 4. Reproductor: Oyentes e IPs ("cuantas veces lo hacen")
  const listenersTbody = $('player-listeners-tbody');
  if (listenersTbody) {
    const listeners = data.player?.listeners || [];
    if (!listeners.length) {
      listenersTbody.innerHTML = '<tr><td colspan="4" class="analytics-empty">Sin oyentes en este periodo.</td></tr>';
    } else {
      listenersTbody.innerHTML = listeners
        .map((l) => {
          const flag = getFlagEmoji(l.code);
          return `
            <tr>
              <td><span class="ip-pill">${escapeHtml(l.ip)}</span></td>
              <td>${flag} ${escapeHtml(l.city)}, ${escapeHtml(l.code)}</td>
              <td class="cell-num">
                <span class="badge-count">${l.plays} ${l.plays === 1 ? 'vez' : 'veces'}</span>
              </td>
              <td class="cell-right cell-muted">
                ${escapeHtml(l.last_active)}
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // 4. Telemetría del Sistema Petra (TG 734, 73452, 73473)
  const petraContainer = $('petra-talkgroups-container');
  if (petraContainer) {
    const talkgroups = data.petra?.talkgroups || [];
    if (!talkgroups.length) {
      petraContainer.innerHTML = '<p class="analytics-empty">Sin interacciones registradas en Petra en este periodo.</p>';
    } else {
      petraContainer.innerHTML = talkgroups
        .map((tg) => {
          const views = tg.views || 0;
          const uniqueUsers = tg.unique_users || 0;
          const percent = Math.max(0, Math.min(100, Number(tg.percent) || 0));
          const badgeClass = tg.id === '734' ? 'badge-tg-main' : tg.id === '73452' ? 'badge-tg-alert' : 'badge-tg-rcv';

          return `
            <div class="petra-tg-card">
              <div class="petra-tg-head">
                <div class="petra-tg-info">
                  <span class="badge-tag-category ${badgeClass}">TG ${escapeHtml(tg.id)}</span>
                  <span class="petra-tg-badge-meta">${escapeHtml(tg.badge)}</span>
                </div>
                <a href="/petra/${encodeURIComponent(tg.id)}" target="_blank" rel="noopener" class="petra-tg-link" title="Ver monitoreo en vivo">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
              <div class="petra-tg-title">${escapeHtml(tg.name)}</div>
              ${tg.sub ? `<div class="petra-tg-sub">${escapeHtml(tg.sub)}</div>` : ''}
              
              <div class="petra-tg-metrics">
                <div class="petra-metric-block">
                  <span class="metric-val">${fmt(views)}</span>
                  <span class="metric-lbl">${views === 1 ? 'interacción' : 'interacciones'}</span>
                </div>
                <div class="petra-metric-block">
                  <span class="metric-val">${fmt(uniqueUsers)}</span>
                  <span class="metric-lbl">${uniqueUsers === 1 ? 'usuario' : 'usuarios'}</span>
                </div>
                <div class="petra-metric-block petra-metric-right">
                  <span class="metric-val">${percent}%</span>
                  <span class="metric-lbl">del interés</span>
                </div>
              </div>

              <div class="petra-tg-progress">
                <div class="petra-tg-progress-fill ${badgeClass}" style="width: ${percent}%;"></div>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // 5. Clics en Enlaces
  const linkClicksTbody = $('link-clicks-tbody');
  if (linkClicksTbody) {
    const links = data.links || [];
    if (!links.length) {
      linkClicksTbody.innerHTML = '<tr><td colspan="3" class="analytics-empty">Sin clics en enlaces en este periodo.</td></tr>';
    } else {
      linkClicksTbody.innerHTML = links
        .map((link) => {
          return `
            <tr>
              <td>
                <div class="cell-strong">${escapeHtml(link.title)}</div>
                <div class="cell-url">${escapeHtml(link.url)}</div>
              </td>
              <td class="col-opt">
                <span class="badge-tag-category">${escapeHtml(link.category === 'external_link' ? 'Externo' : link.category === 'portal_link' ? 'Portal' : (link.category || 'Enlace'))}</span>
              </td>
              <td class="cell-num cell-right">
                ${fmt(link.clicks)}
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // 6. Países Conectados: Detalle de Actividad Global
  const globalCountriesTbody = $('global-countries-tbody');
  if (globalCountriesTbody) {
    const countries = data.countries_detail || [];
    if (!countries.length) {
      globalCountriesTbody.innerHTML = '<tr><td colspan="4" class="analytics-empty">Sin conexiones registradas en este periodo.</td></tr>';
    } else {
      globalCountriesTbody.innerHTML = countries
        .map((c) => {
          const flag = getFlagEmoji(c.code);
          const percent = Math.max(0, Math.min(100, Number(c.percent) || 0));
          return `
            <tr>
              <td>
                <div class="country-cell-info">
                  <span class="country-flag-icon">${flag}</span>
                  <div class="country-titles">
                    <span class="country-name-text">${escapeHtml(c.country)}</span>
                    <span class="country-code-pill">${escapeHtml(c.code)}</span>
                  </div>
                </div>
              </td>
              <td class="cell-num">
                <span class="badge-count">${fmt(c.unique_visitors)} ${c.unique_visitors === 1 ? 'usuario' : 'usuarios'}</span>
              </td>
              <td class="cell-num">
                <span class="cell-strong">${fmt(c.total)}</span>
              </td>
              <td class="cell-interest">
                <div class="interest-wrap">
                  <div class="country-bar-track" style="flex: 1;">
                    <div class="country-bar-fill" style="width: ${percent}%;"></div>
                  </div>
                  <span class="interest-val">${percent}%</span>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // Origen de las visitas: una barra por canal, ordenadas de mayor a menor
  const trafficContainer = $('traffic-sources-container');
  if (trafficContainer) {
    const sources = data.traffic?.sources || [];
    if (!sources.length) {
      trafficContainer.innerHTML =
        '<p class="analytics-empty">Todavía no hay visitas registradas en este periodo. Los datos empiezan a contarse desde que se publicó esta versión del sitio.</p>';
    } else {
      trafficContainer.innerHTML = sources
        .map((s) => {
          const percent = Math.max(0, Math.min(100, Number(s.percent) || 0));
          const people = Number(s.people) || 0;
          return `
            <div class="share-platform-row">
              <div class="share-platform-header">
                <span class="share-platform-name">${escapeHtml(s.name)}</span>
                <span class="share-platform-count">
                  <strong>${fmt(s.visits)}</strong> <span>${percent}%</span>
                </span>
              </div>
              <div class="share-track">
                <div class="share-fill" style="width: ${percent}%;"></div>
              </div>
              <span class="share-platform-sub">${fmt(people)} ${people === 1 ? 'persona' : 'personas'}</span>
            </div>
          `;
        })
        .join('');
    }
  }

  // Sitios concretos desde los que llegaron visitas
  const sitesTbody = $('traffic-sites-tbody');
  if (sitesTbody) {
    const sites = data.traffic?.sites || [];
    if (!sites.length) {
      sitesTbody.innerHTML =
        '<tr><td colspan="3" class="analytics-empty">Ningún sitio externo nos enlazó en este periodo.</td></tr>';
    } else {
      sitesTbody.innerHTML = sites
        .map(
          (site) => `
            <tr>
              <td><span class="cell-strong">${escapeHtml(site.host)}</span></td>
              <td class="col-opt">${escapeHtml(site.source)}</td>
              <td class="cell-right"><strong>${fmt(site.visits)}</strong></td>
            </tr>
          `
        )
        .join('');
    }
  }

  // 7. Compartidos en Redes
  const sharesContainer = $('social-shares-container');
  if (sharesContainer) {
    const platforms = data.shares?.platforms || [];
    if (!platforms.length) {
      sharesContainer.innerHTML = '<p class="analytics-empty">Sin compartidos en este periodo.</p>';
    } else {
      sharesContainer.innerHTML = platforms
        .map((p) => {
          return `
            <div class="share-platform-row">
              <div class="share-platform-header">
                <span class="share-platform-name">${escapeHtml(p.name)}</span>
                <span class="share-platform-count">
                  <strong>${fmt(p.shares)}</strong> <span>${Number(p.percent) || 0}%</span>
                </span>
              </div>
              <div class="share-track">
                <div class="share-fill" style="width: ${Math.max(0, Math.min(100, Number(p.percent) || 0))}%;"></div>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // 7. Lectura de Publicaciones
  const postsTbody = $('posts-views-tbody');
  if (postsTbody) {
    const posts = data.posts || [];
    if (!posts.length) {
      postsTbody.innerHTML = '<tr><td colspan="5" class="analytics-empty">Sin noticias publicadas.</td></tr>';
    } else {
      const maxViews = Math.max(1, ...posts.map((p) => Number(p.views) || 0));
      postsTbody.innerHTML = posts
        .map((post) => {
          const relative = Math.round(((Number(post.views) || 0) / maxViews) * 100);
          return `
            <tr>
              <td>
                <div class="cell-strong">${post.slug ? `<a href="/blog/${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">${escapeHtml(post.title)}</a>` : escapeHtml(post.title)}</div>
              </td>
              <td class="col-opt">
                <span class="badge-tag-category is-neutral">${escapeHtml(post.category || 'General')}</span>
              </td>
              <td class="cell-num">
                ${fmt(post.views)}
              </td>
              <td class="cell-num cell-muted col-opt">
                ${fmt(post.shares || 0)}
              </td>
              <td class="cell-interest" title="${relative}% respecto a la noticia más leída">
                <div class="interest-wrap">
                  <span class="interest-track"><span class="interest-fill" style="width: ${relative}%;"></span></span>
                  <span class="interest-value">${relative}%</span>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }
}

// --------------------------------------------------------------------
const EMPTY_ANALYTICS: AnalyticsData = {
  kpis: {
    player_plays: 0,
    unique_listeners: 0,
    link_clicks: 0,
    post_views: 0,
    post_shares: 0,
    active_countries: 0,
  },
  map_points: [],
  player: {
    countries: [],
    listeners: [],
    total_plays: 0,
  },
  live_audio: {
    is_active: false,
    total_listeners: 0,
    countries: [],
  },
  countries_detail: [],
  links: [],
  posts: [],
  shares: {
    platforms: [],
    total: 0,
  },
};

// --------------------------------------------------------------------
// Carga de Datos desde la API
// --------------------------------------------------------------------
export async function loadAnalytics(range = '7d') {
  currentRange = range;
  try {
    const res = await fetch(`/api/analytics.php?action=stats&range=${encodeURIComponent(range)}`, { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.kpis) {
        renderDashboard(data);
        return;
      }
    }
    renderDashboard(EMPTY_ANALYTICS);
  } catch (err) {
    renderDashboard(EMPTY_ANALYTICS);
  }
}

// --------------------------------------------------------------------
// Inicializador Global de Analíticas
// --------------------------------------------------------------------
export function initAnalytics() {
  if (!$('view-dashboard')) return;

  // Botones de filtro de rango de tiempo (7d, 30d, all)
  document.querySelectorAll('.btn-time-range').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-time-range').forEach((b) => b.classList.remove('is-active'));
      const target = e.currentTarget as HTMLButtonElement;
      target.classList.add('is-active');
      const r = target.dataset.range || '7d';
      loadAnalytics(r);
    });
  });

  // Botones de filtro del mapa (all, player_play, link_click, post_view)
  document.querySelectorAll('[data-map-filter]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-map-filter]').forEach((b) => b.classList.remove('is-active'));
      const target = e.currentTarget as HTMLButtonElement;
      target.classList.add('is-active');
      currentFilter = target.dataset.mapFilter || 'all';
      renderMarkers();
    });
  });

  // Botón para resetear zoom y centrar en Venezuela
  $('btn-reset-map')?.addEventListener('click', () => {
    if (mapInstance) {
      mapInstance.setView([8.5, -66.0], 5, { animate: true });
    }
  });

  // Escuchar cuando el usuario navega a 'dashboard'
  document.addEventListener('bm:view', (e) => {
    if ((e as CustomEvent<string>).detail === 'dashboard') {
      setTimeout(() => {
        initMap();
        mapInstance?.invalidateSize();
      }, 100);
      loadAnalytics(currentRange);
    }
  });

  // Carga inicial al cargar el panel
  loadAnalytics(currentRange).then(() => {
    // Inicializar mapa si el dashboard ya está visible
    if ($('view-dashboard')?.classList.contains('is-active')) {
      setTimeout(() => {
        initMap();
        mapInstance?.invalidateSize();
      }, 200);
    }
  });

  // Refresco automático de telemetría y oyentes en vivo cada 30s mientras esté visible
  setInterval(() => {
    if (document.visibilityState === 'visible' && $('view-dashboard')?.classList.contains('is-active')) {
      loadAnalytics(currentRange);
    }
  }, 30000);
}
