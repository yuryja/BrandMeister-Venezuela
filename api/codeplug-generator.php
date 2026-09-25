<?php
/**
 * Generador Dinámico de Archivos CSV y Codeplugs para Radios DMR
 * BrandMeister Venezuela (MCC 734)
 * Formatos soportados: AnyTone, OpenGD77, TYT/Retevis, Radioddity, Motorola MOTOTRBO, Universal/Excel
 */

@ini_set('memory_limit', '512M');
@set_time_limit(180);

require_once __DIR__ . '/db.php';
bm_cors_headers();

$model = strtolower(trim($_GET['model'] ?? 'anytone'));
$type = strtolower(trim($_GET['type'] ?? 'all')); // 'talkgroups', 'contacts', 'all'
$scope = strtolower(trim($_GET['scope'] ?? 'venezuela')); // 'venezuela', 'latam', 'global'
$includeTgs = isset($_GET['include_tgs']) ? (bool)(int)$_GET['include_tgs'] : true;
$action = strtolower(trim($_GET['action'] ?? 'download')); // 'meta', 'download', 'preview'

$allowedModels = ['anytone', 'opengd77', 'tyt', 'radioddity', 'motorola', 'universal'];
if (!in_array($model, $allowedModels, true)) {
    $model = 'anytone';
}

$cacheDir = sys_get_temp_dir() . '/bm_radioid_cache';
$dumpFile = $cacheDir . '/users_dump.json';
$veFile = $cacheDir . '/users_ve.json';
$latamFile = $cacheDir . '/users_latam.json';
$metaFile = $cacheDir . '/sync_meta.json';

/**
 * 1. Base Canónica de Talkgroups Oficiales de BrandMeister Venezuela e Internacionales
 */
function get_talkgroups_list(): array {
    return [
        // Nacionales Prioritarios
        [
            'tg' => '734',
            'name' => 'TG 734 Venezuela',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Nacional',
            'city' => 'Venezuela',
            'state' => 'Nacional',
            'country' => 'Venezuela',
            'notes' => 'Canal Principal de Cobertura Nacional'
        ],
        [
            'tg' => '734911',
            'name' => 'TG 734911 Emergencias EMCOM',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Emergencia',
            'city' => 'Caracas',
            'state' => 'Nacional',
            'country' => 'Venezuela',
            'notes' => 'Red Nacional de Emergencia YV5RNE'
        ],
        [
            'tg' => '73452',
            'name' => 'TG 73452 Boletines YVRNE',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Servicio',
            'city' => 'Caracas',
            'state' => 'Nacional',
            'country' => 'Venezuela',
            'notes' => 'Boletines y emisiones técnicas'
        ],
        [
            'tg' => '73473',
            'name' => 'TG 73473 Radio Club Vzla',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Institucional',
            'city' => 'Caracas',
            'state' => 'Distrito Capital',
            'country' => 'Venezuela',
            'notes' => 'Ruedas y enlaces institucionales'
        ],
        [
            'tg' => '73411',
            'name' => 'TG 73411 Red Vzlana Radioafic',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Comunidad',
            'city' => 'Venezuela',
            'state' => 'Nacional',
            'country' => 'Venezuela',
            'notes' => 'Red Venezolana de Radioaficionados'
        ],
        [
            'tg' => '7340',
            'name' => 'TG 7340 Tactico 1 Desborde',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Táctico',
            'city' => 'Venezuela',
            'state' => 'Nacional',
            'country' => 'Venezuela',
            'notes' => 'Canal de QSO y desborde para liberar TG 734'
        ],
        [
            'tg' => '73499',
            'name' => 'TG 73499 Tactico 2 Eventos',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Táctico',
            'city' => 'Venezuela',
            'state' => 'Nacional',
            'country' => 'Venezuela',
            'notes' => 'Expediciones y actividades especiales'
        ],
        // Circuitos Regionales
        [
            'tg' => '7341',
            'name' => 'TG 7341 C1 Occidente',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'Maracaibo / Coro',
            'state' => 'Zulia, Falcón, Trujillo',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 1'
        ],
        [
            'tg' => '7342',
            'name' => 'TG 7342 C2 Los Andes',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'San Cristóbal / Mérida',
            'state' => 'Táchira, Mérida, Barinas',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 2'
        ],
        [
            'tg' => '7343',
            'name' => 'TG 7343 C3 Centroccidente',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'Barquisimeto',
            'state' => 'Lara, Portuguesa, Yaracuy',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 3'
        ],
        [
            'tg' => '7344',
            'name' => 'TG 7344 C4 Region Central',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'Valencia / Maracay',
            'state' => 'Carabobo, Aragua, Cojedes',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 4'
        ],
        [
            'tg' => '7345',
            'name' => 'TG 7345 C5 Capital Litoral Llanos',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'Caracas / La Guaira',
            'state' => 'Caracas, Miranda, La Guaira, Guárico',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 5'
        ],
        [
            'tg' => '7346',
            'name' => 'TG 7346 C6 Oriente Sur Guayana',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'Puerto La Cruz / Pto Ordaz',
            'state' => 'Anzoátegui, Bolívar',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 6'
        ],
        [
            'tg' => '7347',
            'name' => 'TG 7347 C7 Oriente Norte Insular',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'Porlamar / Cumaná',
            'state' => 'Nueva Esparta, Sucre',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 7'
        ],
        [
            'tg' => '7348',
            'name' => 'TG 7348 C8 Oriente Deltaico',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'Maturín / Tucupita',
            'state' => 'Monagas, Delta Amacuro',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 8'
        ],
        [
            'tg' => '7349',
            'name' => 'TG 7349 C9 Llanos Sur Amazonia',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Regional',
            'city' => 'San Fernando / Pto Ayacucho',
            'state' => 'Apure, Amazonas',
            'country' => 'Venezuela',
            'notes' => 'Circuito Regional 9'
        ],
        // Internacionales de Alto Tráfico
        [
            'tg' => '91',
            'name' => 'TG 91 Worldwide Mundial',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Internacional',
            'city' => 'Global',
            'state' => 'Mundo',
            'country' => 'Global',
            'notes' => 'Canal Mundial BrandMeister'
        ],
        [
            'tg' => '913',
            'name' => 'TG 913 America Latina Iberoam',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Internacional',
            'city' => 'Latam',
            'state' => 'Iberoamérica',
            'country' => 'Regional',
            'notes' => 'Enlace en Español de Habla Hispana'
        ],
        [
            'tg' => '334',
            'name' => 'TG 334 Mexico Nacional',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Internacional',
            'city' => 'Ciudad de México',
            'state' => 'CDMX',
            'country' => 'México',
            'notes' => 'Red Hermana México'
        ],
        [
            'tg' => '730',
            'name' => 'TG 730 Chile Nacional',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Internacional',
            'city' => 'Santiago',
            'state' => 'RM',
            'country' => 'Chile',
            'notes' => 'Master Primario 7301'
        ],
        [
            'tg' => '732',
            'name' => 'TG 732 Colombia Nacional',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Internacional',
            'city' => 'Bogotá',
            'state' => 'Cundinamarca',
            'country' => 'Colombia',
            'notes' => 'Red Hermana Colombia'
        ],
        [
            'tg' => '214',
            'name' => 'TG 214 Espana Nacional',
            'slot' => '1',
            'type' => 'Group Call',
            'category' => 'Internacional',
            'city' => 'Madrid',
            'state' => 'España',
            'country' => 'España',
            'notes' => 'Red BrandMeister España'
        ],
        [
            'tg' => '9',
            'name' => 'TG 9 Local Reflector Slot 2',
            'slot' => '2',
            'type' => 'Group Call',
            'category' => 'Local',
            'city' => 'Local',
            'state' => 'Local',
            'country' => 'Local',
            'notes' => 'Tráfico Local en Ranura 2'
        ]
    ];
}

/**
 * 2. Cargar contactos de RadioID según el alcance
 */
function get_contacts_list(string $scope, string $cacheDir): array {
    $veFile = $cacheDir . '/users_ve.json';
    $latamFile = $cacheDir . '/users_latam.json';
    $dumpFile = $cacheDir . '/users_dump.json';

    $targetFile = match ($scope) {
        'latam' => $latamFile,
        'global' => $dumpFile,
        default => $veFile
    };

    if (file_exists($targetFile)) {
        $content = @file_get_contents($targetFile);
        if ($content !== false) {
            $data = json_decode($content, true);
            if (isset($data['users']) && is_array($data['users'])) return $data['users'];
            if (isset($data['results']) && is_array($data['results'])) return $data['results'];
            if (is_array($data)) return $data;
        }
    }

    // Si el archivo en caché no existe todavía, intentar consulta rápida a RadioID API para Venezuela
    if ($scope === 'venezuela') {
        $url = 'https://database.radioid.net/api/dmr/user/?country=Venezuela';
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 8,
                'header' => "User-Agent: BM-Venezuela-Codeplug/1.0\r\nAccept: application/json\r\n"
            ]
        ]);
        $res = @file_get_contents($url, false, $ctx);
        if ($res !== false) {
            $json = json_decode($res, true);
            if (!empty($json['results'])) {
                if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
                @file_put_contents($veFile, json_encode($json['results'], JSON_UNESCAPED_UNICODE));
                return $json['results'];
            }
        }
    }

    // Datos semilla de emergencia de operadores conocidos si aún no hay conexión
    return [
        ['id' => 734001, 'callsign' => 'YV5OF', 'fname' => 'Sysop', 'surname' => 'BM-YV', 'city' => 'Caracas', 'state' => 'Miranda', 'country' => 'Venezuela'],
        ['id' => 7341003, 'callsign' => 'YV5VE', 'fname' => 'William', 'surname' => 'Fourneau', 'city' => 'Altagracia', 'state' => 'Guárico', 'country' => 'Venezuela'],
        ['id' => 7340520, 'callsign' => 'YV5RNE', 'fname' => 'Red Nal', 'surname' => 'Emergencia', 'city' => 'Caracas', 'state' => 'DC', 'country' => 'Venezuela'],
        ['id' => 7340003, 'callsign' => 'YY3BIG', 'fname' => 'Big', 'surname' => 'Radio', 'city' => 'Caracas', 'state' => 'DC', 'country' => 'Venezuela']
    ];
}

/**
 * Endpoint de Metadatos (Para que la UI sepa cuántos contactos hay y fecha de sync)
 */
if ($action === 'meta') {
    header('Content-Type: application/json; charset=utf-8');
    $meta = [];
    if (file_exists($metaFile)) {
        $meta = json_decode(@file_get_contents($metaFile), true) ?: [];
    }
    echo json_encode([
        'status' => 'success',
        'meta' => $meta,
        'talkgroups_count' => count(get_talkgroups_list()),
        'cache_exists' => [
            'venezuela' => file_exists($veFile),
            'latam' => file_exists($latamFile),
            'global' => file_exists($dumpFile),
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * 3. Formateadores de CSV por Modelo de Radio
 */

function clean_csv_field(mixed $val): string {
    $str = trim((string)$val);
    return str_replace(['"', "\r", "\n"], ['""', ' ', ' '], $str);
}

// AnyTone: TalkGroups.csv
function format_anytone_talkgroups(array $tgs): string {
    $out = "\xEF\xBB\xBF"; // UTF-8 BOM para Excel / AnyTone CPS
    $out .= "\"No.\",\"Radio ID\",\"Name\",\"City\",\"Call Type\",\"Call Alert\"\r\n";
    $i = 1;
    foreach ($tgs as $tg) {
        $out .= sprintf(
            "\"%d\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
            $i++,
            clean_csv_field($tg['tg']),
            clean_csv_field($tg['name']),
            clean_csv_field($tg['city']),
            'Group Call',
            'None'
        );
    }
    return $out;
}

// AnyTone: DigitalContactList.csv
function format_anytone_contacts(array $contacts): string {
    $out = "\xEF\xBB\xBF";
    $out .= "\"No.\",\"Radio ID\",\"Callsign\",\"Name\",\"City\",\"State\",\"Country\",\"Remarks\",\"Call Type\",\"Call Alert\"\r\n";
    $i = 1;
    foreach ($contacts as $c) {
        $fullName = trim(($c['fname'] ?? '') . ' ' . ($c['surname'] ?? ''));
        if ($fullName === '') $fullName = $c['callsign'] ?? '';
        $out .= sprintf(
            "\"%d\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
            $i++,
            clean_csv_field($c['id'] ?? $c['radio_id'] ?? ''),
            clean_csv_field($c['callsign'] ?? ''),
            clean_csv_field($fullName),
            clean_csv_field($c['city'] ?? ''),
            clean_csv_field($c['state'] ?? ''),
            clean_csv_field($c['country'] ?? ''),
            'BrandMeister',
            'Private Call',
            'None'
        );
    }
    return $out;
}

// OpenGD77: Contacts.csv (Incluye Talkgroups y Contactos Privados)
function format_opengd77_contacts(array $tgs, array $contacts, bool $includeTgs): string {
    $out = "\xEF\xBB\xBF";
    $out .= "\"Contact Name\",\"ID\",\"Type\",\"Timeslot\"\r\n";
    if ($includeTgs) {
        foreach ($tgs as $tg) {
            $out .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
                clean_csv_field($tg['name']),
                clean_csv_field($tg['tg']),
                'Group Call',
                'TS' . clean_csv_field($tg['slot'])
            );
        }
    }
    foreach ($contacts as $c) {
        $name = trim(($c['callsign'] ?? '') . ' ' . ($c['fname'] ?? ''));
        $out .= sprintf(
            "\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
            clean_csv_field($name),
            clean_csv_field($c['id'] ?? $c['radio_id'] ?? ''),
            'Private Call',
            'TS1'
        );
    }
    return $out;
}

// TYT / Retevis (MD-380, MD-390, MD-9600, RT3, RT82)
function format_tyt_contacts(array $tgs, array $contacts, bool $includeTgs): string {
    $out = "\xEF\xBB\xBF";
    $out .= "\"Contact Name\",\"Call Type\",\"Call ID\",\"Call Receive Tone\"\r\n";
    if ($includeTgs) {
        foreach ($tgs as $tg) {
            $out .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
                clean_csv_field(substr($tg['name'], 0, 16)), // Límite 16 caracteres en TYT MD-380
                'Group Call',
                clean_csv_field($tg['tg']),
                'No'
            );
        }
    }
    foreach ($contacts as $c) {
        $name = trim(($c['callsign'] ?? '') . ' ' . substr($c['fname'] ?? '', 0, 8));
        $out .= sprintf(
            "\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
            clean_csv_field(substr($name, 0, 16)),
            'Private Call',
            clean_csv_field($c['id'] ?? $c['radio_id'] ?? ''),
            'No'
        );
    }
    return $out;
}

// Radioddity CPS (GD-77 stock / DB25-D)
function format_radioddity_contacts(array $tgs, array $contacts, bool $includeTgs): string {
    $out = "\xEF\xBB\xBF";
    $out .= "\"Name\",\"City/Callsign\",\"Call ID\",\"Call Type\"\r\n";
    if ($includeTgs) {
        foreach ($tgs as $tg) {
            $out .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
                clean_csv_field($tg['name']),
                clean_csv_field($tg['city']),
                clean_csv_field($tg['tg']),
                'Group Call'
            );
        }
    }
    foreach ($contacts as $c) {
        $fullName = trim(($c['fname'] ?? '') . ' ' . ($c['surname'] ?? ''));
        $out .= sprintf(
            "\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
            clean_csv_field($c['callsign'] ?? ''),
            clean_csv_field($fullName ?: ($c['city'] ?? '')),
            clean_csv_field($c['id'] ?? $c['radio_id'] ?? ''),
            'Private Call'
        );
    }
    return $out;
}

// Motorola MOTOTRBO CPS
function format_motorola_contacts(array $tgs, array $contacts, bool $includeTgs): string {
    $out = "\xEF\xBB\xBF";
    $out .= "\"Call Type\",\"Call Name\",\"Call ID\"\r\n";
    if ($includeTgs) {
        foreach ($tgs as $tg) {
            $out .= sprintf(
                "\"%s\",\"%s\",\"%s\"\r\n",
                'Group Call',
                clean_csv_field(substr($tg['name'], 0, 16)),
                clean_csv_field($tg['tg'])
            );
        }
    }
    foreach ($contacts as $c) {
        $name = trim(($c['callsign'] ?? '') . ' ' . ($c['fname'] ?? ''));
        $out .= sprintf(
            "\"%s\",\"%s\",\"%s\"\r\n",
            'Private Call',
            clean_csv_field(substr($name, 0, 16)),
            clean_csv_field($c['id'] ?? $c['radio_id'] ?? '')
        );
    }
    return $out;
}

// Universal / Excel / Spreadsheet
function format_universal_csv(array $tgs, array $contacts, bool $includeTgs): string {
    $out = "\xEF\xBB\xBF";
    $out .= "\"Indice\",\"Tipo\",\"ID / Talkgroup\",\"Indicativo\",\"Nombre\",\"Ciudad\",\"Estado\",\"País\",\"Ranura (Slot)\",\"Notas\"\r\n";
    $i = 1;
    if ($includeTgs) {
        foreach ($tgs as $tg) {
            $out .= sprintf(
                "\"%d\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
                $i++,
                'Talkgroup (Grupo)',
                clean_csv_field($tg['tg']),
                'TG ' . clean_csv_field($tg['tg']),
                clean_csv_field($tg['name']),
                clean_csv_field($tg['city']),
                clean_csv_field($tg['state']),
                clean_csv_field($tg['country']),
                'Slot ' . clean_csv_field($tg['slot']),
                clean_csv_field($tg['notes'])
            );
        }
    }
    foreach ($contacts as $c) {
        $fullName = trim(($c['fname'] ?? '') . ' ' . ($c['surname'] ?? ''));
        $out .= sprintf(
            "\"%d\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\r\n",
            $i++,
            'Contacto Privado',
            clean_csv_field($c['id'] ?? $c['radio_id'] ?? ''),
            clean_csv_field($c['callsign'] ?? ''),
            clean_csv_field($fullName),
            clean_csv_field($c['city'] ?? ''),
            clean_csv_field($c['state'] ?? ''),
            clean_csv_field($c['country'] ?? ''),
            'Ranura 1 / 2',
            'Usuario Registrado RadioID'
        );
    }
    return $out;
}

/**
 * 4. Procesar y Enviar la Respuesta
 */

$tgs = get_talkgroups_list();
$contacts = ($type === 'talkgroups') ? [] : get_contacts_list($scope, $cacheDir);
$dateStr = date('Ymd');

// Caso 1: AnyTone paquete completo ZIP con archivos separados (TalkGroups.csv + DigitalContactList.csv)
if ($model === 'anytone' && $type === 'all' && class_exists('ZipArchive')) {
    $zip = new ZipArchive();
    $tmpZip = tempnam(sys_get_temp_dir(), 'bm_anytone_');
    if ($zip->open($tmpZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
        $zip->addFromString('TalkGroups.csv', format_anytone_talkgroups($tgs));
        $zip->addFromString('DigitalContactList.csv', format_anytone_contacts($contacts));
        $readme = "BrandMeister Venezuela - Archivos CSV para AnyTone (D878 / D578)\r\n"
                . "Generado el: " . date('Y-m-d H:i:s') . "\r\n\r\n"
                . "Instrucciones de Importación:\r\n"
                . "1. Abre tu software de programación AnyTone CPS.\r\n"
                . "2. Menú 'Tool' -> 'Import' -> Selecciona 'TalkGroups' e importa 'TalkGroups.csv'.\r\n"
                . "3. Menú 'Tool' -> 'Import' -> Selecciona 'Digital Contact List' e importa 'DigitalContactList.csv'.\r\n"
                . "4. Escribe la programación en tu radio.\r\n";
        $zip->addFromString('LEEME_INSTRUCCIONES.txt', $readme);
        $zip->close();

        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="AnyTone_Codeplug_BM_Venezuela_' . $scope . '_' . $dateStr . '.zip"');
        header('Content-Length: ' . filesize($tmpZip));
        readfile($tmpZip);
        @unlink($tmpZip);
        exit;
    }
}

// Caso 2: Cualquier archivo CSV individual
header('Content-Type: text/csv; charset=utf-8');

if ($model === 'anytone') {
    if ($type === 'talkgroups') {
        header('Content-Disposition: attachment; filename="AnyTone_TalkGroups_BM_YV_' . $dateStr . '.csv"');
        echo format_anytone_talkgroups($tgs);
    } else {
        header('Content-Disposition: attachment; filename="AnyTone_DigitalContactList_' . $scope . '_' . $dateStr . '.csv"');
        echo format_anytone_contacts($contacts);
    }
    exit;
}

if ($model === 'opengd77') {
    header('Content-Disposition: attachment; filename="OpenGD77_Contacts_BM_YV_' . $scope . '_' . $dateStr . '.csv"');
    echo format_opengd77_contacts($tgs, $contacts, $includeTgs);
    exit;
}

if ($model === 'tyt') {
    header('Content-Disposition: attachment; filename="TYT_MD380_Contacts_BM_YV_' . $scope . '_' . $dateStr . '.csv"');
    echo format_tyt_contacts($tgs, $contacts, $includeTgs);
    exit;
}

if ($model === 'radioddity') {
    header('Content-Disposition: attachment; filename="Radioddity_Contacts_BM_YV_' . $scope . '_' . $dateStr . '.csv"');
    echo format_radioddity_contacts($tgs, $contacts, $includeTgs);
    exit;
}

if ($model === 'motorola') {
    header('Content-Disposition: attachment; filename="MOTOTRBO_Contacts_BM_YV_' . $scope . '_' . $dateStr . '.csv"');
    echo format_motorola_contacts($tgs, $contacts, $includeTgs);
    exit;
}

// Formato Universal por defecto
header('Content-Disposition: attachment; filename="DMR_Codeplug_Universal_BM_YV_' . $scope . '_' . $dateStr . '.csv"');
echo format_universal_csv($tgs, $contacts, $includeTgs);
exit;
