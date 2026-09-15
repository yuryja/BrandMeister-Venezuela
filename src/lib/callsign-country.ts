/**
 * Maps ham radio callsign prefixes to ISO 3166-1 alpha-2 country codes.
 * Used with the flag-icons CSS library (class="fi fi-{code}").
 * Prefixes are checked longest-first so more specific prefixes win.
 */
const PREFIX_MAP: Record<string, string> = {
  // Venezuela
  YV: 've', YX: 've', YY: 've',
  // United States
  AA: 'us', AB: 'us', AC: 'us', AD: 'us', AE: 'us', AF: 'us', AG: 'us', AH: 'us',
  AI: 'us', AJ: 'us', AK: 'us', AL: 'us',
  K: 'us', N: 'us', W: 'us',
  // Canada
  VA: 'ca', VB: 'ca', VC: 'ca', VD: 'ca', VE: 'ca', VF: 'ca', VG: 'ca',
  VY: 'ca', CF: 'ca', CG: 'ca', CH: 'ca', CI: 'ca', CJ: 'ca', CK: 'ca', VX: 'ca',
  // Mexico
  XA: 'mx', XB: 'mx', XC: 'mx', XD: 'mx', XE: 'mx', XF: 'mx',
  // Brazil
  PP: 'br', PQ: 'br', PR: 'br', PS: 'br', PT: 'br', PU: 'br', PV: 'br',
  PW: 'br', PX: 'br', PY: 'br',
  // Argentina
  LO: 'ar', LP: 'ar', LQ: 'ar', LR: 'ar', LS: 'ar', LT: 'ar', LU: 'ar',
  LV: 'ar', LW: 'ar',
  // Colombia
  HJ: 'co', HK: 'co',
  // Chile
  CA: 'cl', CB: 'cl', CC: 'cl', CD: 'cl', CE: 'cl', XQ: 'cl', XR: 'cl',
  // Peru
  OA: 'pe', OB: 'pe', OC: 'pe',
  // Bolivia
  CP: 'bo',
  // Ecuador
  HC: 'ec', HD: 'ec',
  // Paraguay
  ZP: 'py',
  // Uruguay
  CV: 'uy', CX: 'uy',
  // Cuba
  CL: 'cu', CM: 'cu', CN: 'cu', CO: 'cu', T4: 'cu',
  // Dominican Republic
  HI: 'do',
  // Panama
  HP: 'pa',
  // Costa Rica
  TE: 'cr', TI: 'cr',
  // Guatemala
  TG: 'gt',
  // Honduras
  HR: 'hn',
  // El Salvador
  YS: 'sv',
  // Nicaragua
  YN: 'ni',
  // Belize
  V3: 'bz',
  // Haiti
  HH: 'ht',
  // Spain
  EA: 'es', EB: 'es', EC: 'es', ED: 'es', EE: 'es', EF: 'es', EG: 'es', EH: 'es',
  AM: 'es', AN: 'es', AO: 'es',
  // Portugal
  CR: 'pt', CS: 'pt', CT: 'pt', CU: 'pt',
  // France
  F: 'fr',
  // Germany
  DA: 'de', DB: 'de', DC: 'de', DD: 'de', DE: 'de', DF: 'de', DG: 'de',
  DH: 'de', DI: 'de', DJ: 'de', DK: 'de', DL: 'de', DM: 'de', DN: 'de',
  DO: 'de', DP: 'de', DQ: 'de', DR: 'de',
  // United Kingdom
  G: 'gb', M: 'gb',
  // Italy
  I: 'it',
  // Netherlands
  PA: 'nl', PB: 'nl', PC: 'nl', PD: 'nl', PE: 'nl', PF: 'nl', PG: 'nl', PH: 'nl', PI: 'nl',
  // Belgium
  ON: 'be', OO: 'be',
  // Switzerland
  HB: 'ch', HE: 'ch',
  // Austria
  OE: 'at',
  // Sweden
  SA: 'se', SB: 'se', SC: 'se', SD: 'se', SE: 'se', SF: 'se', SG: 'se',
  SH: 'se', SI: 'se', SJ: 'se', SK: 'se', SL: 'se', SM: 'se',
  // Norway
  LA: 'no', LB: 'no', LC: 'no', LD: 'no', LE: 'no',
  LF: 'no', LG: 'no', LH: 'no', LI: 'no', LJ: 'no', LK: 'no', LL: 'no',
  LM: 'no', LN: 'no',
  // Denmark
  OZ: 'dk', OU: 'dk', OV: 'dk', OW: 'dk',
  // Finland
  OF: 'fi', OG: 'fi', OH: 'fi', OI: 'fi', OJ: 'fi',
  // Russia
  RA: 'ru', RB: 'ru', RC: 'ru', RD: 'ru', RE: 'ru', RF: 'ru', RG: 'ru',
  RH: 'ru', RI: 'ru', RJ: 'ru', RK: 'ru', RL: 'ru', RM: 'ru', RN: 'ru',
  RO: 'ru', RP: 'ru', RQ: 'ru', RR: 'ru', RS: 'ru', RT: 'ru', RU: 'ru',
  RV: 'ru', RW: 'ru', RX: 'ru', RY: 'ru', RZ: 'ru',
  UA: 'ru', UB: 'ru', UC: 'ru', UD: 'ru', UE: 'ru', UF: 'ru', UG: 'ru',
  UH: 'ru', UI: 'ru',
  // Japan
  JA: 'jp', JB: 'jp', JC: 'jp', JD: 'jp', JE: 'jp', JF: 'jp', JG: 'jp',
  JH: 'jp', JI: 'jp', JJ: 'jp', JK: 'jp', JL: 'jp', JM: 'jp', JN: 'jp',
  JO: 'jp', JP: 'jp', JQ: 'jp', JR: 'jp', JS: 'jp',
  // China
  BA: 'cn', BB: 'cn', BC: 'cn', BD: 'cn', BE: 'cn', BF: 'cn', BG: 'cn',
  BH: 'cn', BI: 'cn', BJ: 'cn', BK: 'cn', BL: 'cn', BM: 'cn', BN: 'cn',
  BO: 'cn', BP: 'cn', BQ: 'cn', BR: 'cn', BS: 'cn', BT: 'cn', BU: 'cn',
  BV: 'tw',
  // South Korea
  DS: 'kr', DT: 'kr', HL: 'kr',
  // Australia
  VH: 'au', VI: 'au', VJ: 'au', VK: 'au', VL: 'au', VM: 'au', VN: 'au', AX: 'au',
  // New Zealand
  ZK: 'nz', ZL: 'nz', ZM: 'nz',
  // South Africa
  ZR: 'za', ZS: 'za', ZT: 'za', ZU: 'za',
  // India
  AT: 'in', AU: 'in', AV: 'in', AW: 'in', VU: 'in', VV: 'in', VW: 'in',
};

/**
 * Returns the ISO 3166-1 alpha-2 country code for a given callsign.
 * Returns null if no match found.
 */
export function callsignToCountry(callsign: string): string | null {
  if (!callsign) return null;
  const cs = callsign.toUpperCase().trim();
  // Try prefixes from longest (4) to shortest (1) for specificity
  for (let len = 4; len >= 1; len--) {
    const prefix = cs.slice(0, len);
    if (PREFIX_MAP[prefix]) return PREFIX_MAP[prefix];
  }
  return null;
}
