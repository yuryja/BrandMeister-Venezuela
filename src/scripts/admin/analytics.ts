// Panel · Analíticas y Telemetría del Escritorio
// Integración con Leaflet + Leaflet.markercluster y KPIs en tiempo real

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
    active_countries: number;
  };
  map_points: MapPoint[];
  player: {
    countries: Array<{ country: string; code: string; plays: number; percent: number }>;
    listeners: Array<{ ip: string; country: string; code: string; city: string; plays: number; last_active: string; status: string }>;
    total_plays: number;
  };
  links: Array<{ title: string; url: string; category?: string; clicks: number }>;
  posts: Array<{ title: string; category: string; views: number; shares?: number }>;
  shares: {
    platforms: Array<{ name: string; shares: number; percent: number; color: string }>;
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
  if (!countryCode || countryCode.length !== 2) return '🌐';
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

    // Tiles elegantes CartoDB Positron (sobrio, nítido y aesthetic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
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
          <span>${pt.city}</span>
          <span class="bm-popup-badge">${pt.country}</span>
        </div>
        <div class="bm-popup-stat">
          <span>Total actividad:</span>
          <strong>${pt.count} interacciones</strong>
        </div>
        ${audioPlays ? `<div class="bm-popup-stat"><span>🔊 Reproductor audio:</span><strong>${audioPlays}</strong></div>` : ''}
        ${linkClicks ? `<div class="bm-popup-stat"><span>🔗 Clics en enlaces:</span><strong>${linkClicks}</strong></div>` : ''}
        ${postViews ? `<div class="bm-popup-stat"><span>📰 Lecturas blog:</span><strong>${postViews}</strong></div>` : ''}
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

  // 1. KPIs
  if ($('kpi-player-plays')) $('kpi-player-plays')!.textContent = fmt(data.kpis?.player_plays);
  if ($('kpi-unique-listeners')) $('kpi-unique-listeners')!.textContent = fmt(data.kpis?.unique_listeners);
  if ($('kpi-link-clicks')) $('kpi-link-clicks')!.textContent = fmt(data.kpis?.link_clicks);
  if ($('kpi-post-views')) $('kpi-post-views')!.textContent = fmt(data.kpis?.post_views);
  if ($('kpi-post-shares')) $('kpi-post-shares')!.textContent = fmt(data.kpis?.post_shares);
  if ($('kpi-active-countries')) $('kpi-active-countries')!.textContent = fmt(data.kpis?.active_countries);

  // 2. Mapa
  renderMarkers();

  // 3. Reproductor: Países
  const countriesList = $('player-countries-list');
  if (countriesList) {
    const countries = data.player?.countries || [];
    if (!countries.length) {
      countriesList.innerHTML = '<p style="font-size:0.85rem; color:#64748B;">Sin datos de reproducción aún.</p>';
    } else {
      countriesList.innerHTML = countries
        .map((c) => {
          const flag = getFlagEmoji(c.code);
          return `
            <div class="country-bar-item">
              <div class="country-bar-header">
                <span class="country-name-wrap">
                  <span>${flag}</span>
                  <span>${c.country}</span>
                  <span class="country-code-pill">${c.code}</span>
                </span>
                <span class="country-bar-metrics">
                  <strong>${fmt(c.plays)}</strong>
                  <span>(${c.percent}%)</span>
                </span>
              </div>
              <div class="country-bar-track">
                <div class="country-bar-fill" style="width: ${c.percent}%;"></div>
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
      listenersTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:#64748B;">Sin registros recientes de oyentes.</td></tr>';
    } else {
      listenersTbody.innerHTML = listeners
        .map((l) => {
          const flag = getFlagEmoji(l.code);
          return `
            <tr>
              <td><span class="ip-pill">${l.ip}</span></td>
              <td>${flag} ${l.city}, ${l.code}</td>
              <td style="text-align: center;">
                <span class="badge-count">${l.plays} ${l.plays === 1 ? 'escucha' : 'escuchas'}</span>
              </td>
              <td style="text-align: right; color: #64748B; font-size: 0.8rem;">
                <span class="status-dot-active"></span>${l.last_active}
              </td>
            </tr>
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
      linkClicksTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:1.5rem; color:#64748B;">No hay clics en enlaces registrados todavía.</td></tr>';
    } else {
      linkClicksTbody.innerHTML = links
        .map((link) => {
          return `
            <tr>
              <td>
                <div style="font-weight: 600; color: #0F172A;">${link.title}</div>
                <div style="font-size: 0.74rem; color: #64748B;">${link.url}</div>
              </td>
              <td>
                <span class="badge-tag-category">${link.category || 'Enlace'}</span>
              </td>
              <td style="text-align: right; font-weight: 700; font-variant-numeric: tabular-nums;">
                ${fmt(link.clicks)}
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // 6. Compartidos en Redes
  const sharesContainer = $('social-shares-container');
  if (sharesContainer) {
    const platforms = data.shares?.platforms || [];
    if (!platforms.length) {
      sharesContainer.innerHTML = '<p style="font-size:0.85rem; color:#64748B;">Aún no se registran compartidos.</p>';
    } else {
      sharesContainer.innerHTML = platforms
        .map((p) => {
          return `
            <div class="share-platform-row">
              <div class="share-platform-header">
                <span class="share-platform-name">
                  <span class="platform-indicator" style="background: ${p.color};"></span>
                  <span>${p.name}</span>
                </span>
                <span class="share-platform-count">
                  <strong>${fmt(p.shares)}</strong> (${p.percent}%)
                </span>
              </div>
              <div class="share-track">
                <div class="share-fill" style="width: ${p.percent}%; background: ${p.color};"></div>
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
      postsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#64748B;">Sin publicaciones registradas.</td></tr>';
    } else {
      postsTbody.innerHTML = posts
        .map((post) => {
          return `
            <tr>
              <td>
                <div style="font-weight: 600; color: #0F172A;">${post.title}</div>
              </td>
              <td>
                <span class="badge-tag-category" style="background: #F1F5F9; color: #334155;">${post.category || 'General'}</span>
              </td>
              <td style="text-align: center; font-weight: 700; font-variant-numeric: tabular-nums;">
                ${fmt(post.views)}
              </td>
              <td style="text-align: center; color: #64748B; font-variant-numeric: tabular-nums;">
                ${fmt(post.shares || 0)}
              </td>
              <td style="text-align: right;">
                <span style="font-size: 0.76rem; font-weight: 600; color: #16A34A; background: #DCFCE7; padding: 0.15rem 0.5rem; border-radius: 9999px;">
                  Alta lectura
                </span>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }
}

// --------------------------------------------------------------------
// Carga de Datos desde la API
// --------------------------------------------------------------------
export async function loadAnalytics(range = '7d') {
  currentRange = range;
  try {
    const res = await fetch(`/api/analytics.php?action=stats&range=${range}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.kpis) {
        renderDashboard(data);
        return;
      }
    }
  } catch (err) {
    console.warn('[BM-YV] No se pudo cargar analíticas del servidor, usando fallback:', err);
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
}
