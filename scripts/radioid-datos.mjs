#!/usr/bin/env node
/**
 * Genera los archivos de contactos de RadioID que usa el generador de codeplugs.
 *
 * Los navegadores no pueden descargar directamente de RadioID (no permite peticiones desde
 * otras webs), así que una tarea de GitHub ejecuta este script cada semana y publica el
 * resultado en la rama `datos-radioid`. El navegador del visitante los descarga desde
 * jsDelivr: el hosting no gasta ancho de banda ni procesador en esto.
 *
 * Uso:
 *   node scripts/radioid-datos.mjs <carpeta-salida> [user.csv local]
 *
 * Salida:
 *   manifest.json                     fecha, columnas y partes de cada alcance
 *   venezuela.tsv, latam-1.tsv…, global-1.tsv…   una fila por usuario, separada por tabuladores
 *
 * Cada parte pesa como máximo 5 MB: jsDelivr no sirve archivos de más de 20 MB y el
 * directorio mundial ya ronda los 16 MB y sigue creciendo.
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FUENTE = 'https://database.radioid.net/static/user.csv';
const MAX_BYTES_PARTE = 5 * 1024 * 1024;
const COLUMNAS = ['id', 'callsign', 'fname', 'surname', 'city', 'state', 'country'];

// Mismos criterios que usaba el generador en PHP
const PAISES_LATAM = new Set([
  'venezuela', 'colombia', 'mexico', 'spain', 'españa', 'chile', 'argentina', 'peru', 'perú',
  'ecuador', 'panama', 'panamá', 'costa rica', 'guatemala', 'honduras', 'el salvador',
  'nicaragua', 'uruguay', 'paraguay', 'bolivia', 'dominican republic', 'república dominicana',
  'puerto rico', 'cuba', 'brazil', 'brasil', 'portugal',
]);
const PREFIJOS_LATAM = ['732', '730', '722', '724', '334', '214'];

// Si RadioID devolviera un archivo roto o vacío, mejor no publicar nada que publicar basura
const MINIMOS = { global: 100_000, venezuela: 300 };

/** Lector de CSV (RFC 4180): respeta comillas, comas y saltos de línea dentro de campos */
function* leerCsv(texto) {
  let fila = [];
  let campo = '';
  let entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else { entreComillas = false; }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ',') {
      fila.push(campo); campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      yield fila;
      fila = [];
    } else {
      campo += c;
    }
  }
  if (campo !== '' || fila.length) { fila.push(campo); yield fila; }
}

/** Un campo apto para TSV: sin tabuladores ni saltos de línea */
const limpio = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim();

async function descargar() {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const res = await fetch(FUENTE, { headers: { 'User-Agent': 'BrandMeister-Venezuela-datos/1.0 (+https://brandmeisteryv.net)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      console.warn(`Intento ${intento} fallido: ${err.message}`);
      if (intento === 3) throw err;
      await new Promise((r) => setTimeout(r, 5000 * intento));
    }
  }
}

/** Reparte las filas en partes de hasta MAX_BYTES_PARTE */
function partir(nombre, filas) {
  const partes = [];
  let actual = [];
  let bytes = 0;
  for (const fila of filas) {
    const tamano = Buffer.byteLength(fila, 'utf8') + 1;
    if (bytes + tamano > MAX_BYTES_PARTE && actual.length) {
      partes.push(actual);
      actual = [];
      bytes = 0;
    }
    actual.push(fila);
    bytes += tamano;
  }
  if (actual.length) partes.push(actual);
  return partes.map((lineas, i) => ({
    archivo: partes.length === 1 ? `${nombre}.tsv` : `${nombre}-${i + 1}.tsv`,
    contenido: lineas.join('\n') + '\n',
  }));
}

async function main() {
  const [salida, csvLocal] = process.argv.slice(2);
  if (!salida) {
    console.error('Uso: node scripts/radioid-datos.mjs <carpeta-salida> [user.csv local]');
    process.exit(1);
  }

  const texto = csvLocal ? await readFile(csvLocal, 'utf8') : await descargar();
  const filas = leerCsv(texto.replace(/^﻿/, ''));
  const cabecera = filas.next().value?.map((c) => c.trim().toLowerCase()) ?? [];
  const col = (...nombres) => {
    const i = nombres.map((n) => cabecera.indexOf(n)).find((x) => x >= 0);
    if (i === undefined) throw new Error(`Falta la columna ${nombres[0]} en el CSV de RadioID`);
    return i;
  };
  const indices = [
    col('radio_id', 'id'), col('callsign'), col('first_name', 'fname'), col('last_name', 'surname'),
    col('city'), col('state'), col('country'),
  ];

  const alcances = { venezuela: [], latam: [], global: [] };
  for (const fila of filas) {
    if (fila.length < 3) continue;
    const datos = indices.map((i) => limpio(fila[i]));
    const [id, , , , , , pais] = datos;
    if (!/^\d+$/.test(id)) continue;

    const linea = datos.join('\t');
    const paisMin = pais.toLowerCase();
    const esVenezuela = paisMin === 'venezuela' || id.startsWith('734');
    if (esVenezuela) alcances.venezuela.push(linea);
    if (esVenezuela || PAISES_LATAM.has(paisMin) || PREFIJOS_LATAM.some((p) => id.startsWith(p))) {
      alcances.latam.push(linea);
    }
    alcances.global.push(linea);
  }

  if (alcances.global.length < MINIMOS.global || alcances.venezuela.length < MINIMOS.venezuela) {
    throw new Error(
      `Datos sospechosos (global ${alcances.global.length}, Venezuela ${alcances.venezuela.length}): no se publica nada`
    );
  }

  await rm(salida, { recursive: true, force: true });
  await mkdir(salida, { recursive: true });

  const manifest = {
    actualizado: new Date().toISOString(),
    fuente: 'RadioID.net · user.csv',
    columnas: COLUMNAS,
    alcances: {},
  };
  for (const [nombre, lineas] of Object.entries(alcances)) {
    const partes = partir(nombre, lineas);
    for (const parte of partes) {
      await writeFile(join(salida, parte.archivo), parte.contenido);
    }
    manifest.alcances[nombre] = {
      registros: lineas.length,
      bytes: partes.reduce((t, p) => t + Buffer.byteLength(p.contenido, 'utf8'), 0),
      partes: partes.map((p) => p.archivo),
    };
  }
  await writeFile(join(salida, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  for (const [nombre, a] of Object.entries(manifest.alcances)) {
    console.log(`${nombre.padEnd(10)} ${String(a.registros).padStart(7)} registros  ${(a.bytes / 1048576).toFixed(1)} MB  ${a.partes.length} parte(s)`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
