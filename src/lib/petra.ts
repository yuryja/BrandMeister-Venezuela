export interface PetraLive {
  last_heard?: {
    at: number;
    src_id: number;
    callsign: string;
    name: string;
    dst_id: number;
    dur_ms: number;
    open: boolean;
  };
  recent: Array<{
    at: number;
    src_id: number;
    callsign: string;
    name: string;
    dst_id: number;
    dur_ms: number;
    open: boolean;
  }>;
  link: {
    state: string;
    host: string;
    since: number;
    uptime_24h: number;
    drops_24h: number;
  };
  server_now: number;
}

export interface PetraSummary {
  today: {
    count: number;
    air_ms: number;
    uniq_ops: number;
    avg_ms: number;
    beacons: number;
    alerts: number;
    skipped: number;
    longest_s: number;
  };
  yesterday: {
    count: number;
    air_ms: number;
    uniq_ops: number;
    avg_ms: number;
    beacons: number;
    alerts: number;
    skipped: number;
    longest_s: number;
  };
  ops_7d: number;
}

export interface PetraCalendar {
  days: Array<{ label: string; air_s: number; n: number }>;
  months: Array<{ label: string; air_s: number; n: number }>;
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
  beacons_skipped: { busy: number };
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
}

const BASE_URL = 'https://petra.brandmeisteryv.net/api';

async function safeFetch<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { accept: 'application/json' },
      cache: 'no-cache'
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[Petra API] Failed to fetch ${endpoint}:`, err);
    return fallback;
  }
}

export async function getPetraData() {
  const [
    live,
    summary,
    hourly,
    calendar,
    top7d,
    top1d,
    top30d,
    heatmap,
    health,
    alerts
  ] = await Promise.all([
    safeFetch<PetraLive>('/live?limit=10&tg=734', {
      link: { state: 'up', host: '7301.master.brandmeister.network', since: Date.now() - 86400000, uptime_24h: 100, drops_24h: 0 },
      recent: [],
      server_now: Date.now()
    }),
    safeFetch<PetraSummary>('/summary?tg=734', {
      today: { count: 0, air_ms: 0, uniq_ops: 0, avg_ms: 0, beacons: 0, alerts: 0, skipped: 0, longest_s: 0 },
      yesterday: { count: 0, air_ms: 0, uniq_ops: 0, avg_ms: 0, beacons: 0, alerts: 0, skipped: 0, longest_s: 0 },
      ops_7d: 0
    }),
    safeFetch<number[]>('/hourly?tg=734', new Array(24).fill(0)),
    safeFetch<PetraCalendar>('/calendar?days=30&tg=734', { days: [], months: [] }),
    safeFetch<PetraOperator[]>('/top?days=7&tg=734', []),
    safeFetch<PetraOperator[]>('/top?days=1&tg=734', []),
    safeFetch<PetraOperator[]>('/top?days=30&tg=734', []),
    safeFetch<PetraHeatmapDay[]>('/heatmap?days=7&tg=734', []),
    safeFetch<PetraHealth>('/health?hours=24&tg=734', {
      beacons_sent: 0,
      beacons_skipped: { busy: 0 },
      alerts_sent: 0,
      alerts_seismic: 0,
      alerts_meteo: 0,
      errors: 0,
      window_hours: 24,
      last_beacon_at: Date.now()
    }),
    safeFetch<PetraAlert[]>('/alerts?limit=15&tg=734', [])
  ]);

  return {
    live,
    summary,
    hourly,
    calendar,
    top: {
      '1': top1d,
      '7': top7d,
      '30': top30d
    },
    heatmap,
    health,
    alerts
  };
}

export function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec} s`;
  const min = Math.floor(sec / 60);
  const remainingSec = sec % 60;
  if (min < 60) return `${min} m ${remainingSec} s`;
  const hr = Math.floor(min / 60);
  const remainingMin = min % 60;
  return `${hr} h ${remainingMin} m`;
}

export function formatAirTimeSplit(ms: number): { value: string; unit: string } {
  const min = Math.round(ms / 60000);
  if (min < 1) {
    return { value: String(Math.round(ms / 1000)), unit: 's' };
  }
  if (min < 60) {
    return { value: String(min), unit: 'min' };
  }
  const hr = Math.floor(min / 60);
  const remainingMin = min % 60;
  return { value: `${hr} h ${String(remainingMin).padStart(2, '0')}`, unit: 'm' };
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diffSec = Math.max(0, Math.round((now - timestamp) / 1000));
  if (diffSec < 45) return 'hace unos segundos';
  if (diffSec < 90) return 'hace 1 min';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr} h`;
  const diffDays = Math.floor(diffHr / 24);
  return `hace ${diffDays} d`;
}

export function formatAlertTitle(alert: PetraAlert): { title: string; category: 'sismo' | 'meteo' | 'baliza' | 'aviso' } {
  if (alert.kind === 'beacon') {
    const time = alert.file.replace('.wav', '');
    return {
      title: time.length === 4 ? `Baliza horaria · ${time.slice(0, 2)}:${time.slice(2)} h` : 'Baliza horaria',
      category: 'baliza'
    };
  }
  const clean = alert.file.replace(/\.wav$/, '').toLowerCase();
  if (clean.startsWith('sismo')) {
    return { title: 'Boletín de Reporte Sísmico', category: 'sismo' };
  }
  if (clean.startsWith('inameh') || clean.startsWith('clima') || clean.startsWith('meteo')) {
    return { title: 'Boletín Meteorológico INAMEH', category: 'meteo' };
  }
  return {
    title: clean.replace(/_\d+$/, '').replace(/[_-]+/g, ' ') || 'Aviso Especial',
    category: 'aviso'
  };
}
