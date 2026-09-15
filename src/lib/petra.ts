/**
 * Tipos, configuración por talkgroup y formatos de la API de Petra
 * (https://petra.brandmeisteryv.net/api). Compartido por las páginas y el cliente.
 */

export interface PetraTransmission {
  at: number;
  src_id: number;
  callsign: string;
  name: string;
  dst_id: number;
  dur_ms: number;
  open: boolean;
}

export interface PetraLive {
  last_heard?: PetraTransmission | null;
  recent: PetraTransmission[];
  link?: {
    state: string;
    host: string;
    since: number;
    uptime_24h: number;
    drops_24h: number;
  };
  server_now: number;
}

export interface PetraDaySummary {
  count: number;
  air_ms: number;
  uniq_ops: number;
  avg_ms: number;
  beacons: number;
  alerts: number;
  skipped: number;
  longest_s: number;
}

export interface PetraSummary {
  today: PetraDaySummary;
  yesterday: PetraDaySummary;
  ops_7d: number;
}

export interface PetraBucket {
  label: string;
  air_s: number;
  n: number;
}

export interface PetraCalendar {
  days: PetraBucket[];
  months: PetraBucket[];
}

export interface PetraOperator {
  id: number;
  callsign: string;
  name: string;
  count: number;
  air_ms: number;
  last_at: number;
}

export interface PetraHeatmapDay {
  day: string;
  hours: number[];
}

export interface PetraHealth {
  beacons_sent: number;
  /** Balizas omitidas por motivo: activity, busy, missing… */
  beacons_skipped: Record<string, number>;
  alerts_sent: number;
  alerts_seismic: number;
  alerts_meteo: number;
  errors: number;
  window_hours: number;
  last_beacon_at: number;
}

export interface PetraAlert {
  at: number;
  kind: string;
  file: string;
  dur_ms: number;
  error?: string;
}

export interface PetraRneStat {
  label: string;
  avg: number;
}

export interface PetraRneReport {
  day: string;
  stations: Array<{
    id: number;
    callsign: string;
    name: string;
    at: number;
    air_ms: number;
  }>;
}

// ── Talkgroups ───────────────────────────────────────────────────────────────

export type PetraModule =
  | 'live'
  | 'summary'
  | 'hourly'
  | 'calendar'
  | 'top'
  | 'recent'
  | 'heatmap'
  | 'health'
  | 'alerts'
  | 'rne-stats'
  | 'rne-report';

export interface PetraTalkgroup {
  id: string;
  name: string;
  short: string;
  description: string;
  modules: PetraModule[];
}

const BASE_MODULES: PetraModule[] = ['live', 'summary', 'hourly', 'calendar', 'top', 'recent', 'heatmap'];

/** Mismos módulos que muestra petra.brandmeisteryv.net/{tg} */
export const PETRA_TALKGROUPS: PetraTalkgroup[] = [
  {
    id: '734',
    name: 'Venezuela · Canal Nacional',
    short: 'Nacional',
    description: 'Talkgroup nacional de BrandMeister Venezuela, con balizas horarias y boletines sísmicos y meteorológicos emitidos por Petra.',
    modules: [...BASE_MODULES, 'health', 'alerts']
  },
  {
    id: '73452',
    name: 'Emisiones Técnicas YV5RNE',
    short: 'YV5RNE',
    description: 'Comunicados técnicos y ruedas operativas de la Red Nacional de Emergencia, con estadística de la emisión de las 19:30.',
    modules: [...BASE_MODULES, 'rne-stats', 'rne-report']
  },
  {
    id: '73473',
    name: 'Radio Club Venezolano',
    short: 'RCV',
    description: 'Frecuencia institucional del Radio Club Venezolano para ruedas temáticas, eventos y enlaces.',
    modules: [...BASE_MODULES]
  }
];

export const DEFAULT_PETRA_TG = '734';

export function getPetraTalkgroup(id: string): PetraTalkgroup | undefined {
  return PETRA_TALKGROUPS.find((tg) => tg.id === id);
}

/** Agrega ?tg= igual que el cliente original */
export function withTg(endpoint: string, tg: string): string {
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}tg=${encodeURIComponent(tg)}`;
}

// ── Formatos ─────────────────────────────────────────────────────────────────

export function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ${String(sec % 60).padStart(2, '0')} s`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`;
}

export function formatAirTimeSplit(ms: number): { value: string; unit: string } {
  const min = Math.round(ms / 60000);
  if (min < 1) return { value: String(Math.round(ms / 1000)), unit: 's' };
  if (min < 60) return { value: String(min), unit: 'min' };
  return { value: `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`, unit: 'h' };
}

export function formatClock(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diffSec = Math.max(0, Math.round((now - timestamp) / 1000));
  if (diffSec < 60) return `hace ${diffSec} s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr} h`;
  return `hace ${Math.floor(diffHr / 24)} d`;
}

export type AlertCategory = 'sismo' | 'meteo' | 'baliza' | 'aviso';

export function formatAlertTitle(alert: PetraAlert): { title: string; category: AlertCategory } {
  if (alert.kind === 'beacon') {
    const time = alert.file.replace('.wav', '');
    return {
      title: time.length === 4 ? `Baliza horaria · ${time.slice(0, 2)}:${time.slice(2)}` : 'Baliza horaria',
      category: 'baliza'
    };
  }
  const clean = alert.file.replace(/\.wav$/, '').toLowerCase();
  if (clean.startsWith('sismo')) return { title: 'Reporte sísmico', category: 'sismo' };
  if (clean.startsWith('inameh') || clean.startsWith('clima')) {
    return { title: 'Boletín meteorológico', category: 'meteo' };
  }
  return { title: clean.replace(/_\d+$/, '').replace(/[_-]+/g, ' ') || 'Aviso', category: 'aviso' };
}

/** Nivel 0-4 de la escala "de silencio a saturado" */
export function heatLevel(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.8) return 3;
  return 4;
}

export const BEACON_SKIP_REASONS: Record<string, string> = {
  activity: 'Había conversación',
  busy: 'TG ocupado toda la ventana',
  missing: 'Falta el audio de esa hora'
};
