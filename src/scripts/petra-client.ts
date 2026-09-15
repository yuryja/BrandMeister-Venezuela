import { callsignToCountry } from '../lib/callsign-country';
import {
  BEACON_SKIP_REASONS,
  formatAirTimeSplit,
  formatAlertTitle,
  formatClock,
  formatDuration,
  formatRelativeTime,
  heatLevel,
  withTg,
  type PetraAlert,
  type PetraBucket,
  type PetraCalendar,
  type PetraHealth,
  type PetraHeatmapDay,
  type PetraLive,
  type PetraOperator,
  type PetraRneReport,
  type PetraRneStat,
  type PetraSummary
} from '../lib/petra';

/** Mismo proxy en dev (Vite), Apache (petra.php) y Vercel (rewrite) */
const API_BASE = '/api/petra/';

const ERROR_HTML = '<p class="pt-error">No se pudo consultar la API</p>';
const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// ── Utilidades ───────────────────────────────────────────────────────────────

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Indicativo con bandera y enlace a QRZ; si no hay indicativo se muestra el ID */
function callsignHtml(callsign: string, name: string, id: number): string {
  const cs = (callsign || '').trim();
  const country = cs ? callsignToCountry(cs) : null;
  const flag = country
    ? `<span class="fi fi-${esc(country)} pt-flag" role="img" aria-label="${esc(country.toUpperCase())}"></span>`
    : '';
  const label = cs
    ? `<a class="pt-call" href="https://www.qrz.com/db/${encodeURIComponent(cs)}" target="_blank" rel="noopener noreferrer" title="Ver ${esc(cs)} en QRZ.com">${esc(cs)}</a>`
    : `<span class="pt-call">${esc(id)}</span>`;
  const nameHtml = name ? `<span class="pt-name">${esc(name)}</span>` : '';
  return `<span class="pt-op">${flag}${label}${nameHtml}</span>`;
}

function relHtml(ts: number): string {
  return `<span data-rel="${num(ts)}">${esc(formatRelativeTime(num(ts)))}</span>`;
}

function slot(root: HTMLElement, name: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-petra-slot="${name}"]`);
}

// ── Polling ──────────────────────────────────────────────────────────────────

type Poller = { refresh: () => void; stop: () => void };

/**
 * Consulta un endpoint periódicamente, igual que el cliente original:
 * se pausa con la pestaña oculta y refresca al volver a ella.
 */
function poll<T>(
  endpoint: () => string,
  intervalMs: number,
  onData: (data: T) => void,
  onError: (hadData: boolean) => void
): Poller {
  let timer: number | undefined;
  let hadData = false;
  let controller: AbortController | null = null;
  let firstRun = true;

  const run = async () => {
    window.clearTimeout(timer);
    // La primera consulta se hace siempre (p. ej. pestaña abierta en segundo plano)
    if (!firstRun && document.visibilityState === 'hidden') return;
    firstRun = false;

    controller?.abort();
    controller = new AbortController();
    try {
      const res = await fetch(API_BASE + endpoint(), {
        headers: { accept: 'application/json' },
        cache: 'no-cache',
        signal: controller.signal
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as T;
      hadData = true;
      onData(data);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      onError(hadData);
    }
    timer = window.setTimeout(run, intervalMs);
  };

  const onVisible = () => {
    if (document.visibilityState === 'visible') run();
  };
  document.addEventListener('visibilitychange', onVisible);
  run();

  return {
    refresh: () => {
      hadData = false;
      run();
    },
    stop: () => {
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

// ── Renderizadores ───────────────────────────────────────────────────────────

function renderLink(root: HTMLElement, live: PetraLive) {
  const el = slot(root, 'link');
  if (!el) return;
  const link = live.link;
  if (!link) {
    el.innerHTML = '<span class="pt-badge"><span class="pt-dot"></span>Enlace ?</span>';
    return;
  }
  const up = link.state === 'up';
  const drops = num(link.drops_24h);
  el.innerHTML = `
    <span class="pt-badge ${up ? 'pt-badge--ok' : 'pt-badge--bad'}">
      <span class="pt-dot ${up ? 'pt-dot--ok pt-dot--pulse' : 'pt-dot--bad'}"></span>${up ? 'Enlace activo' : 'Enlace caído'}
    </span>
    <span class="pt-note">Uptime 24 h <strong>${esc(num(link.uptime_24h))}%</strong> · ${drops} ${drops === 1 ? 'caída' : 'caídas'}</span>
    ${link.host ? `<span class="pt-note pt-host">${esc(link.host)}</span>` : ''}
  `;
}

function renderLastHeard(el: HTMLElement, live: PetraLive) {
  const last = live.last_heard;
  if (!last) {
    el.innerHTML = '<p class="pt-empty">Sin actividad registrada todavía</p>';
    return;
  }
  const status = last.open
    ? '<span class="pt-onair"><span class="pt-dot pt-dot--bad pt-dot--pulse"></span>Al aire</span>'
    : `<span class="pt-lh__dur">${esc(formatDuration(num(last.dur_ms)))}</span><span class="pt-note">${relHtml(last.at)}</span>`;
  el.innerHTML = `
    <div class="pt-lh">
      <div class="pt-lh__who">
        ${callsignHtml(last.callsign, '', last.src_id)}
        <div class="pt-lh__sub">
          ${last.name ? `<span class="pt-name">${esc(last.name)}</span><span aria-hidden="true">·</span>` : ''}
          <span class="pt-id">ID ${esc(last.src_id)}</span>
        </div>
      </div>
      <div class="pt-lh__meta">${status}</div>
    </div>
  `;
}

function renderSummary(el: HTMLElement, s: PetraSummary) {
  const t = s.today;
  const y = s.yesterday;
  const diff = num(t.count) - num(y.count);
  const air = formatAirTimeSplit(num(t.air_ms));
  const tile = (label: string, value: string, foot: string, unit = '', tone = '') => `
    <div class="pt-tile">
      <div class="pt-tile__label">${esc(label)}</div>
      <div class="pt-tile__value">${esc(value)}${unit ? `<span class="pt-tile__unit">${esc(unit)}</span>` : ''}</div>
      <div class="pt-tile__foot ${tone}">${esc(foot)}</div>
    </div>`;

  el.innerHTML = [
    tile(
      'Transmisiones hoy',
      num(t.count).toLocaleString('es-VE'),
      diff === 0 ? 'Igual que ayer' : `${diff > 0 ? '+' : ''}${diff} vs ayer a esta hora`,
      '',
      diff > 0 ? 'is-up' : diff < 0 ? 'is-down' : ''
    ),
    tile('Tiempo al aire', air.value, num(t.count) > 0 ? `Media ${formatDuration(num(t.avg_ms))}` : 'Sin tráfico', air.unit),
    tile('Operadores hoy', String(num(t.uniq_ops)), `${num(s.ops_7d)} en 7 días`),
    tile(
      'La más larga',
      num(t.longest_s) > 0 ? formatDuration(num(t.longest_s) * 1000) : '—',
      num(t.alerts) === 1 ? '1 aviso al aire' : `${num(t.alerts)} avisos al aire`
    )
  ].join('');
}

function barsHtml(values: Array<{ value: number; title: string }>, ariaLabel: string, extraClass = ''): string {
  const max = Math.max(...values.map((v) => v.value), 1);
  return `
    <div class="pt-bars ${extraClass}" role="img" aria-label="${esc(ariaLabel)}">
      ${values
        .map((v) => {
          const h = v.value > 0 ? Math.max(3, (v.value / max) * 100) : 2;
          return `<div class="pt-bar pt-heat-${heatLevel(v.value, max)}" style="height:${h.toFixed(1)}%"><span class="pt-tip">${esc(v.title)}</span></div>`;
        })
        .join('')}
    </div>`;
}

function renderHourly(root: HTMLElement, el: HTMLElement, hourly: number[]) {
  const values = Array.isArray(hourly) && hourly.length ? hourly.map(num) : new Array(24).fill(0);
  const peak = Math.max(...values, 0);
  const note = slot(root, 'hourly-note');
  if (note) note.textContent = peak > 0 ? `Pico ${formatDuration(peak)}` : 'Sin tráfico hoy';

  el.innerHTML = `
    ${barsHtml(
      values.map((v, i) => ({
        value: v,
        title: `${String(i).padStart(2, '0')}:00 · ${v > 0 ? formatDuration(v) : 'sin tráfico'}`
      })),
      'Tiempo al aire por hora del día de hoy'
    )}
    <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
  `;
}

/** Hasta `count` etiquetas repartidas, incluyendo siempre la última */
function axisLabels<T>(items: T[], count: number, label: (item: T, index: number) => string): string[] {
  if (items.length === 0) return [];
  const step = Math.max(1, Math.round((items.length - 1) / (count - 1)));
  const out: string[] = [];
  for (let i = 0; i < items.length; i += step) out.push(label(items[i], i));
  const lastLabel = label(items[items.length - 1], items.length - 1);
  if (out[out.length - 1] !== lastLabel) out.push(lastLabel);
  return out;
}

function monthLabel(label: string, prev?: string): string {
  const name = MONTH_NAMES[Number(label.slice(5, 7)) - 1] ?? label;
  return prev && prev.slice(0, 4) === label.slice(0, 4) ? name : `${name} ${label.slice(2, 4)}`;
}

function renderCalendar(root: HTMLElement, el: HTMLElement, cal: PetraCalendar) {
  const days = Array.isArray(cal.days) ? cal.days : [];
  const months = Array.isArray(cal.months) ? cal.months : [];
  const total = days.reduce((acc, d) => acc + num(d.air_s), 0);
  const note = slot(root, 'calendar-note');
  if (note) note.textContent = `${formatDuration(total * 1000)} en 30 días`;

  const bucketTitle = (b: PetraBucket, label: string) =>
    `${label} · ${num(b.air_s) > 0 ? `${formatDuration(num(b.air_s) * 1000)} en ${num(b.n)} transmisiones` : 'sin tráfico'}`;
  const dayLabel = (l: string) => `${l.slice(8, 10)}/${l.slice(5, 7)}`;

  el.innerHTML = `
    <div class="pt-cal">
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 30 días</p>
        ${barsHtml(days.map((d) => ({ value: num(d.air_s), title: bucketTitle(d, dayLabel(d.label)) })), 'Tiempo al aire por día en los últimos 30 días')}
        <div class="pt-axis">${axisLabels(days, 4, (d) => dayLabel(d.label)).map((l) => `<span>${esc(l)}</span>`).join('')}</div>
      </div>
      <div class="pt-cal__block">
        <p class="pt-note">Últimos 12 meses</p>
        ${barsHtml(
          months.map((m, i) => ({ value: num(m.air_s), title: bucketTitle(m, monthLabel(m.label, months[i - 1]?.label)) })),
          'Tiempo al aire por mes en los últimos 12 meses',
          'pt-bars--wide'
        )}
        <div class="pt-axis">${axisLabels(months, 4, (m, i) => monthLabel(m.label, months[i - 1]?.label)).map((l) => `<span>${esc(l)}</span>`).join('')}</div>
      </div>
    </div>
  `;
}

function renderTop(el: HTMLElement, ops: PetraOperator[]) {
  if (!Array.isArray(ops) || ops.length === 0) {
    el.innerHTML = '<p class="pt-empty">Sin actividad en el periodo</p>';
    return;
  }
  const max = num(ops[0].air_ms) || 1;
  el.innerHTML = `
    <ol class="pt-rank">
      ${ops
        .map((op, i) => {
          const pct = Math.max(2, Math.min(100, (num(op.air_ms) / max) * 100));
          return `
            <li class="pt-rank__row">
              <span class="pt-rank__pos ${i < 3 ? `is-podium is-${i + 1}` : ''}">${i + 1}</span>
              <div class="pt-rank__main">
                <div class="pt-row">
                  ${callsignHtml(op.callsign, op.name, op.id)}
                  <span class="pt-row__val">${esc(formatDuration(num(op.air_ms)))}</span>
                </div>
                <div class="pt-meter"><span style="width:${pct.toFixed(1)}%"></span></div>
              </div>
            </li>`;
        })
        .join('')}
    </ol>
  `;
}

function renderRecent(el: HTMLElement, live: PetraLive) {
  const recent = Array.isArray(live.recent) ? live.recent : [];
  if (recent.length === 0) {
    el.innerHTML = '<p class="pt-empty">Sin registros</p>';
    return;
  }
  el.innerHTML = `
    <ul class="pt-list">
      ${recent
        .map(
          (r) => `
          <li class="pt-row">
            ${callsignHtml(r.callsign, r.name, r.src_id)}
            <span class="pt-row__val">
              <span class="pt-clock">${esc(formatClock(num(r.at)))}</span>
              ${r.open ? '<span class="pt-onair pt-onair--sm">Al aire</span>' : `<span>${esc(formatDuration(num(r.dur_ms)))}</span>`}
            </span>
          </li>`
        )
        .join('')}
    </ul>
  `;
}

function renderHeatmap(el: HTMLElement, rows: PetraHeatmapDay[]) {
  const data = Array.isArray(rows) ? rows : [];
  const max = data.reduce((acc, r) => Math.max(acc, ...(r.hours ?? []).map(num)), 0);
  el.innerHTML = `
    <div class="pt-heat" role="img" aria-label="Segundos al aire por hora en los últimos 7 días">
      ${data
        .map((r) => {
          const dayName = DAY_NAMES[new Date(`${r.day}T12:00:00`).getDay()] ?? r.day;
          const cells = (r.hours ?? [])
            .map((sec, h) => {
              const title = `${dayName} ${r.day.slice(8, 10)}/${r.day.slice(5, 7)} · ${String(h).padStart(2, '0')}:00 · ${num(sec) > 0 ? formatDuration(num(sec) * 1000) : 'sin tráfico'}`;
              return `<span class="pt-heat__cell pt-heat-${heatLevel(num(sec), max)}" title="${esc(title)}"></span>`;
            })
            .join('');
          return `<div class="pt-heat__row"><span class="pt-heat__day">${esc(dayName)}</span><div class="pt-heat__cells">${cells}</div></div>`;
        })
        .join('')}
      <div class="pt-heat__row pt-heat__row--axis">
        <span class="pt-heat__day"></span>
        <div class="pt-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
      </div>
    </div>
  `;
}

function feedItem(tone: 'alert' | 'beacon' | 'error', title: string, meta: string): string {
  return `<li class="pt-feed__item pt-feed__item--${tone}"><div class="pt-feed__t">${esc(title)}</div><div class="pt-feed__m">${meta}</div></li>`;
}

function renderHealth(el: HTMLElement, h: PetraHealth) {
  const skipped = Object.entries(h.beacons_skipped ?? {}).map(([k, v]) => [k, num(v)] as const);
  const skippedTotal = skipped.reduce((acc, [, v]) => acc + v, 0);
  const sent = num(h.beacons_sent);
  const needsAttention = num(h.errors) > 0 || num(h.beacons_skipped?.missing) > 0;
  const others = num(h.alerts_sent) - num(h.alerts_seismic) - num(h.alerts_meteo);

  const items: string[] = [];
  if (num(h.alerts_seismic) > 0) items.push(feedItem('alert', `${num(h.alerts_seismic)} boletines sísmicos`, 'FUNVISIS, llegados por la cola'));
  if (num(h.alerts_meteo) > 0) items.push(feedItem('alert', `${num(h.alerts_meteo)} boletines meteorológicos`, 'INAMEH, llegados por la cola'));
  if (others > 0) items.push(feedItem('alert', `${others} otros avisos`, 'Llegados por la cola, sin origen identificado'));
  for (const [reason, count] of skipped) {
    items.push(
      feedItem(
        reason === 'missing' ? 'error' : 'beacon',
        `${count} ${count === 1 ? 'baliza omitida' : 'balizas omitidas'}`,
        esc(BEACON_SKIP_REASONS[reason] ?? reason)
      )
    );
  }
  if (num(h.errors) > 0) items.push(feedItem('error', `${num(h.errors)} errores de audio`, 'Un WAV de la cola no se pudo transmitir'));

  el.innerHTML = `
    <div class="pt-row pt-health__head">
      <span class="pt-badge ${needsAttention ? 'pt-badge--bad' : 'pt-badge--ok'}">
        <span class="pt-dot ${needsAttention ? 'pt-dot--bad' : 'pt-dot--ok'}"></span>${needsAttention ? 'Requiere atención' : 'Operando'}
      </span>
      <span class="pt-row__val"><span><strong>${sent}</strong>/${sent + skippedTotal || 1} balizas</span></span>
    </div>
    ${items.length ? `<ul class="pt-feed">${items.join('')}</ul>` : ''}
    <p class="pt-note pt-health__foot">
      ${num(h.last_beacon_at) > 0 ? `Última baliza ${relHtml(h.last_beacon_at)}` : 'Ninguna baliza en la ventana'}
    </p>
  `;
}

function renderAlerts(el: HTMLElement, alerts: PetraAlert[]) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    el.innerHTML = '<p class="pt-empty">Todavía no se ha transmitido nada</p>';
    return;
  }
  el.innerHTML = `
    <ul class="pt-feed pt-feed--compact">
      ${alerts
        .map((a) => {
          const { title } = formatAlertTitle(a);
          const tone = a.error ? 'error' : a.kind === 'beacon' ? 'beacon' : 'alert';
          const detail = a.error
            ? ` · falló: ${esc(a.error)}`
            : num(a.dur_ms) > 0
              ? ` · ${esc(formatDuration(num(a.dur_ms)))} al aire`
              : '';
          return feedItem(tone, title, `${esc(formatClock(num(a.at)))}${detail}`);
        })
        .join('')}
    </ul>
  `;
}

function renderRneStats(el: HTMLElement, stats: PetraRneStat[]) {
  if (!Array.isArray(stats) || stats.length === 0) {
    el.innerHTML = '<p class="pt-empty">Sin datos en el período</p>';
    return;
  }
  el.innerHTML = `
    <div class="pt-stats">
      ${stats
        .map((s) => `<div class="pt-stat"><span class="pt-stat__label">${esc(s.label)}</span><span class="pt-stat__value">${esc(num(s.avg))}</span></div>`)
        .join('')}
    </div>
  `;
}

function renderRneReport(root: HTMLElement, el: HTMLElement, report: PetraRneReport) {
  const dayEl = slot(root, 'rne-day');
  if (dayEl) {
    dayEl.textContent = report.day || '';
    dayEl.hidden = !report.day;
  }
  const stations = Array.isArray(report.stations) ? report.stations : [];
  if (stations.length === 0) {
    el.innerHTML = '<p class="pt-empty">Todavía no hay una emisión registrada</p>';
    return;
  }
  el.innerHTML = `
    <ul class="pt-list pt-list--columns">
      ${stations
        .map(
          (st) => `
          <li class="pt-row">
            ${callsignHtml(st.callsign, st.name, st.id)}
            <span class="pt-row__val">
              <span class="pt-clock">${esc(formatClock(num(st.at)))}</span>
              <span>${esc(formatDuration(num(st.air_ms)))}</span>
            </span>
          </li>`
        )
        .join('')}
    </ul>
  `;
}

// ── Arranque ─────────────────────────────────────────────────────────────────

export function initPetraDashboard() {
  const root = document.getElementById('petra-dashboard');
  if (!root) return;
  const tg = root.dataset.tg || '734';
  const mod = (name: string) => root.querySelector<HTMLElement>(`[data-petra-module="${name}"]`);

  /** Muestra el error solo si el módulo aún no tenía datos (igual que el original) */
  const failIfEmpty = (el: HTMLElement) => (hadData: boolean) => {
    if (!hadData) el.innerHTML = ERROR_HTML;
  };

  // Enlace + último escuchado + últimas intervenciones comparten /live
  let liveUpdatedAt = 0;
  const updatedEl = slot(root, 'updated');
  const renderUpdated = () => {
    if (updatedEl && liveUpdatedAt) {
      updatedEl.textContent = `Actualizado hace ${Math.round((Date.now() - liveUpdatedAt) / 1000)} s`;
    }
  };
  const liveEl = mod('live');
  const recentEl = mod('recent');
  if (liveEl || recentEl) {
    poll<PetraLive>(
      () => withTg('live?limit=10', tg),
      15_000,
      (data) => {
        liveUpdatedAt = Date.now();
        renderUpdated();
        renderLink(root, data);
        if (liveEl) renderLastHeard(liveEl, data);
        if (recentEl) renderRecent(recentEl, data);
      },
      (hadData) => {
        if (hadData) return;
        if (liveEl) liveEl.innerHTML = ERROR_HTML;
        if (recentEl) recentEl.innerHTML = ERROR_HTML;
      }
    );
  }

  const summaryEl = mod('summary');
  if (summaryEl) poll<PetraSummary>(() => withTg('summary', tg), 60_000, (d) => renderSummary(summaryEl, d), () => {});

  const hourlyEl = mod('hourly');
  if (hourlyEl) poll<number[]>(() => withTg('hourly', tg), 60_000, (d) => renderHourly(root, hourlyEl, d), failIfEmpty(hourlyEl));

  const calendarEl = mod('calendar');
  if (calendarEl) {
    poll<PetraCalendar>(() => withTg('calendar?days=30&months=12', tg), 300_000, (d) => renderCalendar(root, calendarEl, d), failIfEmpty(calendarEl));
  }

  const topEl = mod('top');
  if (topEl) {
    let topDays = '7';
    const topPoller = poll<PetraOperator[]>(
      () => withTg(`top?days=${topDays}&limit=8`, tg),
      60_000,
      (d) => renderTop(topEl, d),
      failIfEmpty(topEl)
    );
    root.querySelectorAll<HTMLButtonElement>('[data-top-days]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const days = btn.dataset.topDays || '7';
        if (days === topDays) return;
        topDays = days;
        root.querySelectorAll<HTMLButtonElement>('[data-top-days]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        topEl.innerHTML = '<div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div><div class="pt-skel"></div>';
        topPoller.refresh();
      });
    });
  }

  const heatmapEl = mod('heatmap');
  if (heatmapEl) poll<PetraHeatmapDay[]>(() => withTg('heatmap?days=7', tg), 300_000, (d) => renderHeatmap(heatmapEl, d), failIfEmpty(heatmapEl));

  const healthEl = mod('health');
  if (healthEl) poll<PetraHealth>(() => withTg('health?hours=24', tg), 60_000, (d) => renderHealth(healthEl, d), failIfEmpty(healthEl));

  const alertsEl = mod('alerts');
  if (alertsEl) poll<PetraAlert[]>(() => withTg('alerts?limit=12', tg), 60_000, (d) => renderAlerts(alertsEl, d), failIfEmpty(alertsEl));

  const rneStatsEl = mod('rne-stats');
  if (rneStatsEl) poll<PetraRneStat[]>(() => withTg('rne-stats', tg), 300_000, (d) => renderRneStats(rneStatsEl, d), failIfEmpty(rneStatsEl));

  const rneReportEl = mod('rne-report');
  if (rneReportEl) {
    poll<PetraRneReport>(() => withTg('rne-last-report', tg), 300_000, (d) => renderRneReport(root, rneReportEl, d), failIfEmpty(rneReportEl));
  }

  // Tiempos relativos y "Actualizado hace N s"
  window.setInterval(() => {
    if (document.visibilityState === 'hidden') return;
    renderUpdated();
    root.querySelectorAll<HTMLElement>('[data-rel]').forEach((el) => {
      const ts = Number(el.dataset.rel);
      if (ts) el.textContent = formatRelativeTime(ts);
    });
  }, 1000);
}
