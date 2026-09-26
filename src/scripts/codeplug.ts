/**
 * Generador de codeplugs en el navegador del visitante.
 *
 * Los contactos de RadioID se descargan desde jsDelivr (con GitHub como respaldo), que sirve la
 * rama `datos-radioid` que actualiza cada semana la tarea "Datos de RadioID". El archivo final
 * se arma aquí mismo y se guarda en el dispositivo: el hosting no gasta ancho de banda ni
 * procesador, y los despliegues ya no cargan con megas de contactos.
 */

export type Modelo = 'anytone' | 'opengd77' | 'baofeng' | 'tyt' | 'radioddity' | 'motorola' | 'universal';
export type Tipo = 'all' | 'talkgroups' | 'contacts';
export type Alcance = 'venezuela' | 'latam' | 'global';

export type Contacto = {
  id: string;
  callsign: string;
  fname: string;
  surname: string;
  city: string;
  state: string;
  country: string;
};

type Talkgroup = {
  tg: string;
  name: string;
  slot: '1' | '2';
  city: string;
  state: string;
  country: string;
  notes: string;
};

export type Manifest = {
  actualizado: string;
  fuente: string;
  columnas: string[];
  alcances: Record<Alcance, { registros: number; bytes: number; partes: string[] }>;
};

const ORIGENES = [
  'https://cdn.jsdelivr.net/gh/yuryja/BrandMeister-Venezuela@datos-radioid/',
  'https://raw.githubusercontent.com/yuryja/BrandMeister-Venezuela/datos-radioid/',
];

/** Talkgroups oficiales de BrandMeister Venezuela e internacionales de uso frecuente */
export const TALKGROUPS: Talkgroup[] = [
  // Nacionales
  { tg: '734', name: 'TG 734 Venezuela', slot: '1', city: 'Venezuela', state: 'Nacional', country: 'Venezuela', notes: 'Canal Principal de Cobertura Nacional' },
  { tg: '734911', name: 'TG 734911 Emergencias EMCOM', slot: '1', city: 'Caracas', state: 'Nacional', country: 'Venezuela', notes: 'Red Nacional de Emergencia YV5RNE' },
  { tg: '73452', name: 'TG 73452 Boletines YVRNE', slot: '2', city: 'Caracas', state: 'Nacional', country: 'Venezuela', notes: 'Boletines y emisiones técnicas' },
  { tg: '73473', name: 'TG 73473 Radio Club Vzla', slot: '2', city: 'Caracas', state: 'Distrito Capital', country: 'Venezuela', notes: 'Ruedas y enlaces institucionales' },
  { tg: '73411', name: 'TG 73411 Red Vzlana Radioafic', slot: '2', city: 'Venezuela', state: 'Nacional', country: 'Venezuela', notes: 'Red Venezolana de Radioaficionados' },
  { tg: '7340', name: 'TG 7340 Tactico 1 Desborde', slot: '2', city: 'Venezuela', state: 'Nacional', country: 'Venezuela', notes: 'Canal de QSO y desborde para liberar TG 734' },
  { tg: '73499', name: 'TG 73499 Tactico 2 Eventos', slot: '2', city: 'Venezuela', state: 'Nacional', country: 'Venezuela', notes: 'Expediciones y actividades especiales' },
  // Circuitos regionales
  { tg: '7341', name: 'TG 7341 C1 Occidente', slot: '2', city: 'Maracaibo / Coro', state: 'Zulia, Falcón, Trujillo', country: 'Venezuela', notes: 'Circuito Regional 1' },
  { tg: '7342', name: 'TG 7342 C2 Los Andes', slot: '2', city: 'San Cristóbal / Mérida', state: 'Táchira, Mérida, Barinas', country: 'Venezuela', notes: 'Circuito Regional 2' },
  { tg: '7343', name: 'TG 7343 C3 Centroccidente', slot: '2', city: 'Barquisimeto', state: 'Lara, Portuguesa, Yaracuy', country: 'Venezuela', notes: 'Circuito Regional 3' },
  { tg: '7344', name: 'TG 7344 C4 Region Central', slot: '2', city: 'Valencia / Maracay', state: 'Carabobo, Aragua, Cojedes', country: 'Venezuela', notes: 'Circuito Regional 4' },
  { tg: '7345', name: 'TG 7345 C5 Capital Litoral Llanos', slot: '2', city: 'Caracas / La Guaira', state: 'Caracas, Miranda, La Guaira, Guárico', country: 'Venezuela', notes: 'Circuito Regional 5' },
  { tg: '7346', name: 'TG 7346 C6 Oriente Sur Guayana', slot: '2', city: 'Puerto La Cruz / Pto Ordaz', state: 'Anzoátegui, Bolívar', country: 'Venezuela', notes: 'Circuito Regional 6' },
  { tg: '7347', name: 'TG 7347 C7 Oriente Norte Insular', slot: '2', city: 'Porlamar / Cumaná', state: 'Nueva Esparta, Sucre', country: 'Venezuela', notes: 'Circuito Regional 7' },
  { tg: '7348', name: 'TG 7348 C8 Oriente Deltaico', slot: '2', city: 'Maturín / Tucupita', state: 'Monagas, Delta Amacuro', country: 'Venezuela', notes: 'Circuito Regional 8' },
  { tg: '7349', name: 'TG 7349 C9 Llanos Sur Amazonia', slot: '2', city: 'San Fernando / Pto Ayacucho', state: 'Apure, Amazonas', country: 'Venezuela', notes: 'Circuito Regional 9' },
  // Internacionales
  { tg: '91', name: 'TG 91 Worldwide Mundial', slot: '1', city: 'Global', state: 'Mundo', country: 'Global', notes: 'Canal Mundial BrandMeister' },
  { tg: '913', name: 'TG 913 America Latina Iberoam', slot: '1', city: 'Latam', state: 'Iberoamérica', country: 'Regional', notes: 'Enlace en Español de Habla Hispana' },
  { tg: '334', name: 'TG 334 Mexico Nacional', slot: '1', city: 'Ciudad de México', state: 'CDMX', country: 'México', notes: 'Red Hermana México' },
  { tg: '730', name: 'TG 730 Chile Nacional', slot: '1', city: 'Santiago', state: 'RM', country: 'Chile', notes: 'Master Primario 7301' },
  { tg: '732', name: 'TG 732 Colombia Nacional', slot: '1', city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', notes: 'Red Hermana Colombia' },
  { tg: '214', name: 'TG 214 Espana Nacional', slot: '1', city: 'Madrid', state: 'España', country: 'España', notes: 'Red BrandMeister España' },
  { tg: '9', name: 'TG 9 Local Reflector Slot 2', slot: '2', city: 'Local', state: 'Local', country: 'Local', notes: 'Tráfico Local en Ranura 2' },
];

export type TgFilter = 'all' | 'national' | 'circuit' | 'regional' | 'international';

export interface CircuitoRegional {
  tg: string;
  numero: string;
  nombre: string;
  region: string;
  estados: string;
}

export const CIRCUITOS_REGIONALES: CircuitoRegional[] = [
  { tg: '7341', numero: '1', nombre: 'Circuito 1: Occidente', region: 'Occidente', estados: 'Zulia, Falcón, Trujillo' },
  { tg: '7342', numero: '2', nombre: 'Circuito 2: Los Andes', region: 'Los Andes y Piedemonte', estados: 'Táchira, Mérida, Barinas' },
  { tg: '7343', numero: '3', nombre: 'Circuito 3: Centroccidente', region: 'Centroccidente', estados: 'Lara, Portuguesa, Yaracuy' },
  { tg: '7344', numero: '4', nombre: 'Circuito 4: Región Central', region: 'Región Central', estados: 'Carabobo, Aragua, Cojedes' },
  { tg: '7345', numero: '5', nombre: 'Circuito 5: Capital, Litoral y Llanos', region: 'Capital, Litoral y Llanos', estados: 'Caracas, Miranda, La Guaira, Guárico' },
  { tg: '7346', numero: '6', nombre: 'Circuito 6: Oriente Sur y Guayana', region: 'Oriente Sur y Guayana', estados: 'Anzoátegui, Bolívar' },
  { tg: '7347', numero: '7', nombre: 'Circuito 7: Oriente Norte e Insular', region: 'Oriente Norte e Insular', estados: 'Nueva Esparta, Sucre' },
  { tg: '7348', numero: '8', nombre: 'Circuito 8: Oriente Deltaico', region: 'Oriente Deltaico', estados: 'Monagas, Delta Amacuro' },
  { tg: '7349', numero: '9', nombre: 'Circuito 9: Llanos del Sur y Amazonía', region: 'Llanos del Sur y Amazonía', estados: 'Apure, Amazonas' },
];

/** Filtra los talkgroups según el criterio de selección y circuito regional opcional */
export function filtrarTalkgroups(filtro: TgFilter, circuitoId?: string): Talkgroup[] {
  if (filtro === 'all') return TALKGROUPS;
  if (filtro === 'national') {
    return TALKGROUPS.filter(t => ['734', '734911', '73452', '73473', '73411', '7340', '73499'].includes(t.tg));
  }
  if (filtro === 'regional') {
    return TALKGROUPS.filter(t => ['7341', '7342', '7343', '7344', '7345', '7346', '7347', '7348', '7349'].includes(t.tg));
  }
  if (filtro === 'circuit') {
    const tgCircuito = circuitoId || '7341';
    return TALKGROUPS.filter(t => ['734', '7340', '73411', '73452', '73473', '734911'].includes(t.tg) || t.tg === tgCircuito);
  }
  if (filtro === 'international') {
    return TALKGROUPS.filter(t => ['91', '913', '334', '730', '732', '214', '9'].includes(t.tg));
  }
  return TALKGROUPS;
}

/** Pide un archivo al primer origen que responda */
async function pedir(archivo: string): Promise<Response> {
  let ultimoError: unknown = null;
  for (const origen of ORIGENES) {
    try {
      // no-cache: el navegador pregunta si cambió y, si no, reutiliza su copia (respuesta 304)
      const res = await fetch(origen + archivo, { cache: 'no-cache' });
      if (res.ok) return res;
      ultimoError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      ultimoError = err;
    }
  }
  throw new Error(`No se pudo descargar ${archivo} (${(ultimoError as Error)?.message ?? 'sin conexión'}).`);
}

let manifestPromesa: Promise<Manifest> | null = null;

export function cargarManifest(): Promise<Manifest> {
  manifestPromesa ??= pedir('manifest.json')
    .then((res) => res.json() as Promise<Manifest>)
    .catch((err) => {
      manifestPromesa = null; // se podrá reintentar
      throw err;
    });
  return manifestPromesa;
}

const contactosEnMemoria = new Map<Alcance, Contacto[]>();

/**
 * Contactos de un alcance, descargados en sus partes. `alProgresar` recibe los bytes ya
 * recibidos y el total: el total viene del manifest porque jsDelivr envía los archivos
 * comprimidos y la cabecera Content-Length no sirve para medir lo descomprimido.
 */
export async function cargarContactos(
  alcance: Alcance,
  alProgresar: (recibidos: number, total: number) => void = () => {}
): Promise<Contacto[]> {
  const guardados = contactosEnMemoria.get(alcance);
  if (guardados) {
    alProgresar(1, 1);
    return guardados;
  }

  const manifest = await cargarManifest();
  const info = manifest.alcances[alcance];
  const total = info.bytes;
  let recibidos = 0;
  const contactos: Contacto[] = [];

  for (const parte of info.partes) {
    const res = await pedir(parte);
    const texto = await leerConProgreso(res, (n) => {
      recibidos += n;
      alProgresar(Math.min(recibidos, total), total);
    });
    for (const linea of texto.split('\n')) {
      if (!linea) continue;
      const [id, callsign, fname, surname, city, state, country] = linea.split('\t');
      contactos.push({ id, callsign, fname, surname, city, state, country });
    }
  }

  alProgresar(total, total);
  contactosEnMemoria.set(alcance, contactos);
  return contactos;
}

async function leerConProgreso(res: Response, alRecibir: (bytes: number) => void): Promise<string> {
  if (!res.body) {
    const texto = await res.text();
    alRecibir(new TextEncoder().encode(texto).byteLength);
    return texto;
  }
  const lector = res.body.getReader();
  const decodificador = new TextDecoder('utf-8');
  let texto = '';
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    alRecibir(value.byteLength);
    texto += decodificador.decode(value, { stream: true });
  }
  return texto + decodificador.decode();
}

// --------------------------------------------------------------------
// Formatos de cada radio (mismas columnas que el generador anterior en PHP)
// --------------------------------------------------------------------

const BOM = '﻿'; // Excel y los CPS reconocen así el UTF-8
const FIN = '\r\n';

/** Campo entre comillas, con las comillas internas duplicadas y sin saltos de línea */
const c = (valor: unknown) => `"${String(valor ?? '').trim().replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
const fila = (...campos: unknown[]) => campos.map(c).join(',') + FIN;
/** Recorte por caracteres (no por bytes: no parte letras con tilde) */
const corto = (texto: string, max: number) => Array.from(texto).slice(0, max).join('');
const nombreCompleto = (x: Contacto) => `${x.fname ?? ''} ${x.surname ?? ''}`.trim();

function anytoneTalkgroups(tgs: Talkgroup[]) {
  return BOM + fila('No.', 'Radio ID', 'Name', 'City', 'Call Type', 'Call Alert')
    + tgs.map((t, i) => fila(i + 1, t.tg, t.name, t.city, 'Group Call', 'None')).join('');
}

function anytoneContactos(contactos: Contacto[]) {
  return BOM + fila('No.', 'Radio ID', 'Callsign', 'Name', 'City', 'State', 'Country', 'Remarks', 'Call Type', 'Call Alert')
    + contactos.map((x, i) =>
      fila(i + 1, x.id, x.callsign, nombreCompleto(x) || x.callsign, x.city, x.state, x.country, 'BrandMeister', 'Private Call', 'None')
    ).join('');
}

/** OpenGD77: Lista de contactos/talkgroups para el Codeplug */
function opengd77Talkgroups(tgs: Talkgroup[]) {
  return BOM + fila('Contact Name', 'ID', 'Type', 'Timeslot')
    + tgs.map((t) => fila(t.name, t.tg, 'Group Call', `TS${t.slot}`)).join('');
}

/** OpenGD77: Libreta de identificación para la memoria flash (DMR ID User Database) */
function opengd77DmrIdDatabase(contactos: Contacto[]) {
  return BOM + fila('Radio ID', 'Callsign', 'Name', 'City', 'State', 'Country')
    + contactos.map((x) =>
      fila(x.id, x.callsign, nombreCompleto(x) || x.callsign, x.city, x.state, x.country)
    ).join('');
}

function tyt(tgs: Talkgroup[], contactos: Contacto[]) {
  // TYT MD-380 y similares: máximo 16 caracteres por nombre
  return BOM + fila('Contact Name', 'Call Type', 'Call ID', 'Call Receive Tone')
    + tgs.map((t) => fila(corto(t.name, 16), 'Group Call', t.tg, 'No')).join('')
    + contactos.map((x) => fila(corto(`${x.callsign} ${corto(x.fname, 8)}`.trim(), 16), 'Private Call', x.id, 'No')).join('');
}

function radioddity(tgs: Talkgroup[], contactos: Contacto[]) {
  return BOM + fila('Name', 'City/Callsign', 'Call ID', 'Call Type')
    + tgs.map((t) => fila(t.name, t.city, t.tg, 'Group Call')).join('')
    + contactos.map((x) => fila(x.callsign, nombreCompleto(x) || x.city, x.id, 'Private Call')).join('');
}

function motorola(tgs: Talkgroup[], contactos: Contacto[]) {
  return BOM + fila('Call Type', 'Call Name', 'Call ID')
    + tgs.map((t) => fila('Group Call', corto(t.name, 16), t.tg)).join('')
    + contactos.map((x) => fila('Private Call', corto(`${x.callsign} ${x.fname}`.trim(), 16), x.id)).join('');
}

function universal(tgs: Talkgroup[], contactos: Contacto[]) {
  let i = 1;
  return BOM + fila('Indice', 'Tipo', 'ID / Talkgroup', 'Indicativo', 'Nombre', 'Ciudad', 'Estado', 'País', 'Ranura (Slot)', 'Notas')
    + tgs.map((t) => fila(i++, 'Talkgroup (Grupo)', t.tg, `TG ${t.tg}`, t.name, t.city, t.state, t.country, `Slot ${t.slot}`, t.notes)).join('')
    + contactos.map((x) =>
      fila(i++, 'Contacto Privado', x.id, x.callsign, nombreCompleto(x), x.city, x.state, x.country, 'Ranura 1 / 2', 'Usuario Registrado RadioID')
    ).join('');
}

// --------------------------------------------------------------------
// ZIP sin compresión (el pack de AnyTone lleva tres archivos)
// --------------------------------------------------------------------

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    tabla[n] = v >>> 0;
  }
  return tabla;
})();

function crc32(datos: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < datos.length; i++) crc = TABLA_CRC[(crc ^ datos[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function crearZip(archivos: Array<{ nombre: string; contenido: string }>): Blob {
  const codificador = new TextEncoder();
  // Bytes sobre un ArrayBuffer normal: es lo que acepta Blob
  const partes: Uint8Array<ArrayBuffer>[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let desplazamiento = 0;

  for (const archivo of archivos) {
    const nombre = codificador.encode(archivo.nombre);
    const datos = codificador.encode(archivo.contenido);
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // firma de cabecera local
    local.setUint16(4, 20, true);         // versión necesaria
    local.setUint16(6, 0x0800, true);     // nombres en UTF-8
    local.setUint16(8, 0, true);          // sin compresión
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombre.length, true);
    partes.push(new Uint8Array(local.buffer), nombre, datos);

    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true); // firma del directorio central
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint32(16, crc, true);
    entrada.setUint32(20, datos.length, true);
    entrada.setUint32(24, datos.length, true);
    entrada.setUint16(28, nombre.length, true);
    entrada.setUint32(42, desplazamiento, true);
    central.push(new Uint8Array(entrada.buffer), nombre);

    desplazamiento += 30 + nombre.length + datos.length;
  }

  const tamanoCentral = central.reduce((t, p) => t + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamanoCentral, true);
  fin.setUint32(16, desplazamiento, true);

  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: 'application/zip' });
}

// --------------------------------------------------------------------
// Archivo final
// --------------------------------------------------------------------

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

const csv = (contenido: string) => new Blob([contenido], { type: 'text/csv;charset=utf-8' });

/** Arma el archivo para la radio elegida. `contactos` va vacío si solo se piden talkgroups. */
export function generarArchivo(
  modelo: Modelo,
  tipo: Tipo,
  alcance: Alcance,
  contactos: Contacto[],
  talkgroupsPersonalizados?: Talkgroup[]
): { nombre: string; blob: Blob } {
  const fecha = hoy();
  const baseTgs = talkgroupsPersonalizados && talkgroupsPersonalizados.length > 0 ? talkgroupsPersonalizados : TALKGROUPS;
  // "Solo contactos" no lleva los talkgroups
  const tgs = tipo === 'contacts' ? [] : baseTgs;

  if (modelo === 'anytone') {
    if (tipo === 'all') {
      const leeme = [
        'BrandMeister Venezuela - Archivos CSV para AnyTone (D878 / D578 / BTECH / Alinco)',
        `Generado el: ${new Date().toLocaleString('es-VE')}`,
        '',
        'Instrucciones de importación:',
        "1. Abre tu software de programación AnyTone CPS.",
        "2. Menú 'Tool' -> 'Import' -> selecciona 'TalkGroups' e importa 'TalkGroups.csv'.",
        "3. Menú 'Tool' -> 'Import' -> selecciona 'Digital Contact List' e importa 'DigitalContactList.csv'.",
        '4. Escribe la programación en tu radio.',
        '',
      ].join(FIN);
      return {
        nombre: `AnyTone_Codeplug_BM_Venezuela_${alcance}_${fecha}.zip`,
        blob: crearZip([
          { nombre: 'TalkGroups.csv', contenido: anytoneTalkgroups(tgs) },
          { nombre: 'DigitalContactList.csv', contenido: anytoneContactos(contactos) },
          { nombre: 'LEEME_INSTRUCCIONES.txt', contenido: leeme },
        ]),
      };
    }
    if (tipo === 'talkgroups') {
      return { nombre: `AnyTone_TalkGroups_BM_YV_${fecha}.csv`, blob: csv(anytoneTalkgroups(tgs)) };
    }
    return { nombre: `AnyTone_DigitalContactList_${alcance}_${fecha}.csv`, blob: csv(anytoneContactos(contactos)) };
  }

  if (modelo === 'opengd77' || modelo === 'baofeng') {
    const radioName = modelo === 'baofeng' ? 'Baofeng DM-32UV / DM-1701 / DM-1801 (OpenGD77)' : 'OpenGD77 / OpenUV380';
    const filePrefix = modelo === 'baofeng' ? 'Baofeng_DM32UV' : 'OpenGD77';
    if (tipo === 'all') {
      const leeme = [
        `BrandMeister Venezuela - Archivos para ${radioName}`,
        'Compatible con: Baofeng DM-32UV, DM-1701, DM-1801, Retevis RT3S, TYT MD-UV380, MD-UV390, MD-9600, Radioddity GD-77',
        `Generado el: ${new Date().toLocaleString('es-VE')}`,
        '',
        'INSTRUCCIONES DE IMPORTACIÓN EN OPENGD77 CPS:',
        '1. Conecta tu radio por cable USB y abre el software OpenGD77 CPS.',
        "2. IMPORTAR TALKGROUPS: En el árbol lateral ve a 'Contacts' -> clic en 'CSV Import' -> selecciona 'OpenGD77_Talkgroups.csv'.",
        "3. IMPORTAR CONTACTOS (DMR ID): Ve al menú superior 'DMR ID' (o 'Radio ID Database') -> clic en 'Import CSV' -> selecciona 'OpenGD77_DMRID_Database.csv'.",
        "4. TRANSFERIR A LA RADIO: Haz clic en 'Write Codeplug' para guardar los canales/talkgroups y luego en 'Write DMR ID' para cargar la libreta de indicativos en la memoria de pantalla.",
        '',
        '¡Listo! Al recibir transmisiones verás el indicativo, nombre y país del operador en la pantalla de tu radio.'
      ].join(FIN);

      return {
        nombre: `${filePrefix}_Codeplug_BM_Venezuela_${alcance}_${fecha}.zip`,
        blob: crearZip([
          { nombre: 'OpenGD77_Talkgroups.csv', contenido: opengd77Talkgroups(tgs) },
          { nombre: 'OpenGD77_DMRID_Database.csv', contenido: opengd77DmrIdDatabase(contactos) },
          { nombre: 'LEEME_OPENGD77.txt', contenido: leeme },
        ]),
      };
    }
    if (tipo === 'talkgroups') {
      return {
        nombre: `${filePrefix}_TalkGroups_BM_YV_${fecha}.csv`,
        blob: csv(opengd77Talkgroups(tgs))
      };
    }
    return {
      nombre: `${filePrefix}_DMRID_Database_${alcance}_${fecha}.csv`,
      blob: csv(opengd77DmrIdDatabase(contactos))
    };
  }

  const formatos: Record<'tyt' | 'radioddity' | 'motorola' | 'universal', [string, (t: Talkgroup[], x: Contacto[]) => string]> = {
    tyt: [`TYT_MD380_Contacts_BM_YV_${alcance}_${fecha}.csv`, tyt],
    radioddity: [`Radioddity_Contacts_BM_YV_${alcance}_${fecha}.csv`, radioddity],
    motorola: [`MOTOTRBO_Contacts_BM_YV_${alcance}_${fecha}.csv`, motorola],
    universal: [`DMR_Codeplug_Universal_BM_YV_${alcance}_${fecha}.csv`, universal],
  };
  const [nombre, formatear] = formatos[modelo];
  return { nombre, blob: csv(formatear(tgs, contactos)) };
}

/** Guarda el archivo en el dispositivo */
export function guardarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
