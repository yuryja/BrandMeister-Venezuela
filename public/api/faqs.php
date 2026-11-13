<?php
/**
 * API para Gestión y Consulta de Preguntas Frecuentes (FAQ).
 *
 * Soporta edición rápida en Markdown (MD) para el panel de administración
 * y entrega de datos estructurados para Schema.org FAQPage y la vista pública.
 *
 * Endpoints públicos:
 *   GET /api/faqs.php               → Lista de FAQs publicadas agrupadas con HTML y Markdown
 *   GET /api/faqs.php?format=md     → Exportación completa en un único documento Markdown
 *
 * Endpoints administrativos (requieren sesión con rol admin o editor):
 *   GET  /api/faqs.php?admin=1      → Todas las FAQs (incluyendo borradores)
 *   POST /api/faqs.php?action=save_all_md → Guarda todo el set desde un documento Markdown completo
 *   POST /api/faqs.php?action=save_item   → Crea o edita una pregunta individual
 *   POST /api/faqs.php?action=delete      → Elimina una pregunta por ID
 *   POST /api/faqs.php?action=toggle      → Alterna estado publicado/borrador
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/markdown.php';

start_secure_session();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$pdo    = get_db_connection();

/**
 * Catálogo estático de respaldo en caso de que la tabla aún no se haya ejecutado en MySQL.
 */
function faqs_default_fallback(): array {
    return [
        [
            'id' => 1,
            'category' => 'Conceptos Fundamentales',
            'question' => '¿Es necesario tener internet para usar DMR?',
            'answer_markdown' => "**No, no es obligatorio tener internet para usar DMR.**\n\nEl estándar **DMR (Digital Mobile Radio Tier II)** es, ante todo, un protocolo de **radiofrecuencia pura (RF)**. Dos radios portátiles o móviles DMR transmiten y reciben paquetes de voz digital modulados en **4FSK** directamente por el aire, de equipo a equipo, exactamente igual que un radio analógico en FM.\n\n- **Modo Directo / Simplex (Radio a Radio sin Internet):** Dos o más operadores en una montaña, en carretera o en una zona de emergencia sin cobertura celular ni electricidad pueden comunicarse en cualquier frecuencia simplex autorizada (como `146.550 MHz` en VHF o `436.550 MHz` en UHF) sin requerir internet, sin repetidor y sin servidor alguno.\n- **A través de Repetidores Físicos Locales (RF Pura):** Si te encuentras dentro del área de cobertura de un repetidor físico (por ejemplo, en Caracas con **YV5DMR** en VHF o **YV5VE** en UHF), tu radio se comunica por ondas de radio directas con la torre del cerro. Incluso si el repetidor perdiera su enlace a internet, los operadores locales pueden continuar comunicándose entre sí a través del repetidor por RF.\n- **¿Cuándo SÍ se utiliza internet?:** Internet interviene únicamente como **medio de transporte troncal (Backhaul IP)** para interconectar repetidores distantes entre ciudades o países (la red mundial BrandMeister) o cuando el operador utiliza en su casa un **Hotspot personal (MMDVM / Pi-Star)**.",
            'sort_order' => 1,
            'is_published' => 1
        ],
        [
            'id' => 2,
            'category' => 'Conceptos Fundamentales',
            'question' => '¿Puedo comunicarme entre un radio analógico y uno digital DMR en la misma frecuencia?',
            'answer_markdown' => "**No de forma directa por radiofrecuencia.**\n\nAunque ambos radios operen en la misma frecuencia exacta (por ejemplo, `146.550 MHz`), el tipo de modulación es completamente distinto:\n- El radio analógico modula en **FM convencional**.\n- El radio DMR modula un flujo binario en **4FSK** codificado por el vocoder **AMBE+2**.\n\nEn un radio analógico solo escucharás ruido digital estridente. Solo es posible cruzarlos mediante repetidores o servidores que tengan habilitadas pasarelas mixtas analógico-digitales (puentes IP).",
            'sort_order' => 2,
            'is_published' => 1
        ],
        [
            'id' => 3,
            'category' => 'Conceptos Fundamentales',
            'question' => '¿Por qué la batería de un radio dura hasta un 40% más en DMR que en analógico?',
            'answer_markdown' => "En FM analógica, el transmisor de potencia emite radiación de forma continua durante toda tu intervención.\n\nEn **DMR Tier II**, gracias a la tecnología **TDMA (Time Division Multiple Access)**, el canal se divide en dos ranuras de tiempo de **30 milisegundos**. Cuando transmites en Slot 1, tu radio enciende la etapa de amplificación durante 30 ms y **la apaga durante los siguientes 30 ms** mientras corresponde el turno al Slot 2.\n\nEste ciclo de trabajo del **50% encendido / 50% apagado** reduce a la mitad el consumo eléctrico y la temperatura del equipo, otorgando hasta un 40% más de autonomía.",
            'sort_order' => 3,
            'is_published' => 1
        ],
        [
            'id' => 4,
            'category' => 'Conceptos Fundamentales',
            'question' => '¿Qué es la regla de los 3 segundos en DMR y por qué es obligatoria?',
            'answer_markdown' => "Consiste en esperar al menos **3 segundos** después de que tu corresponsal suelta el PTT antes de comenzar a hablar tú.\n\nEs fundamental porque:\n1. Permite que los servidores IP y repetidores liberen la portadora troncal.\n2. Concede una ventana de tiempo indispensable para que estaciones con tráfico urgente o de emergencia (como la Red Nacional de Emergencia YV5RNE en TG 734911) puedan interrumpir.\n3. En DMR, si dos personas transmiten a la vez, no se escuchan montadas: las tramas se cancelan y se produce silencio.",
            'sort_order' => 4,
            'is_published' => 1
        ],
        [
            'id' => 5,
            'category' => 'Conceptos Fundamentales',
            'question' => '¿Cómo funciona el canal de eco / Parrot (9990) para probar mi transmisión?',
            'answer_markdown' => "Permite verificar tu modulación y audio sin molestar a otros colegas:\n\n1. En tu radio, selecciona o digita una **Llamada Privada (Private Call)** al ID **`9990`**.\n2. Pulsa PTT en tu repetidor o hotspot e identifícate: *\"YV5XXX haciendo prueba de modulación en 9990\"*.\n3. Suelta el PTT. El servidor BrandMeister te devolverá tu propia grabación segundos después exactamente como te escuchan los demás.",
            'sort_order' => 5,
            'is_published' => 1
        ],
        [
            'id' => 6,
            'category' => 'Arquitectura de Red',
            'question' => '¿Cuál es la diferencia técnica entre Time Slot 1 (TS1) y Time Slot 2 (TS2) en DMR?',
            'answer_markdown' => "DMR divide una misma frecuencia en dos ranuras temporales independientes:\n\n- **Time Slot 1 (Slot 1):** Reservado en BrandMeister Venezuela para **tráfico nacional e internacional de amplia cobertura**: TG 734 (Nacional), TG 734911 (Emergencias EMCOM) y canales globales (TG 91, TG 913).\n- **Time Slot 2 (Slot 2):** Reservado para **tráfico regional, local y comunitario**: los 9 circuitos regionales venezolanos (TG 7341-7349), Radio Club Venezolano (TG 73473), canales tácticos (TG 7340/73499) y hotspots personales.",
            'sort_order' => 6,
            'is_published' => 1
        ],
        [
            'id' => 7,
            'category' => 'Arquitectura de Red',
            'question' => '¿Qué es un Talkgroup (TG) y cómo funciona la activación estática vs dinámica?',
            'answer_markdown' => "Un **Talkgroup (TG)** es un canal o grupo de conversación virtual identificado por un número.\n\n- **Talkgroups Estáticos:** Están permanentemente abiertos en el repetidor. En Venezuela, el **TG 734** está anclado de forma estática en todos los repetidores oficiales.\n- **Talkgroups Dinámicos (Bajo Demanda):** Se activan en el repetidor cuando pulsas el PTT en ese grupo durante 1 segundo. El servidor mantiene enlazado el canal durante 10 a 15 minutos; si no hay transmisiones en ese lapso, se desconecta automáticamente.",
            'sort_order' => 7,
            'is_published' => 1
        ],
        [
            'id' => 8,
            'category' => 'Arquitectura de Red',
            'question' => '¿Cuándo y cómo debo hacer QSY (cambio de canal) desde el Talkgroup 734?',
            'answer_markdown' => "El **TG 734** es para llamada y encuentro general (CQ) a escala nacional. Si tu contacto durará más de 2 o 3 minutos, lo correcto es invitar a tu corresponsal a pasar a un circuito regional en Slot 2 (como TG 7345 en la región central o TG 7340 táctico) para dejar libre el canal nacional para otros colegas.",
            'sort_order' => 8,
            'is_published' => 1
        ],
        [
            'id' => 9,
            'category' => 'Arquitectura de Red',
            'question' => '¿Qué es el Color Code (CC) y por qué usamos Color Code 1 (CC1) en toda Venezuela?',
            'answer_markdown' => "El **Color Code (CC)** equivale al subtono CTCSS digital. En la red BrandMeister Venezuela se ha estandarizado el **Color Code 1 (CC1)** en todos los repetidores y puntos de acceso para mantener la compatibilidad y facilitar la programación uniforme de los codeplugs.",
            'sort_order' => 9,
            'is_published' => 1
        ],
        [
            'id' => 10,
            'category' => 'Repetidores y Cobertura',
            'question' => '¿Cómo me conecto a los repetidores DMR de Caracas (YV5DMR en VHF y YV5VE en UHF)?',
            'answer_markdown' => "En Caracas operan dos repetidores principales:\n- **YV5DMR (ID 734500) en VHF:** TX `147.240 MHz` / RX `147.840 MHz` (+0.600 MHz), Color Code 1. Emplazamiento pionero en El Ávila con cobertura en Gran Caracas y Valles del Tuy.\n- **YV5VE (ID 734014) en UHF:** TX `439.600 MHz` / RX `434.600 MHz` (-5.000 MHz), Color Code 1. Alta penetración urbana metropolitana.",
            'sort_order' => 10,
            'is_published' => 1
        ],
        [
            'id' => 11,
            'category' => 'Repetidores y Cobertura',
            'question' => '¿Qué repetidores cubren Valencia, La Guaira, los Llanos y el Occidente de Venezuela?',
            'answer_markdown' => "- **La Guaira:** YV5CBO (ID 734016) en VHF `147.150 MHz` (+0.600 MHz), CC1.\n- **Valencia / Carabobo:** YV4EGG (ID 734013) en VHF `146.700 MHz` (-0.600 MHz), CC1.\n- **Llanos (Guárico):** Altagracia YV5VE (`147.390 MHz`), Cerro Portachuelo YV5VE (`146.820 MHz`), Platillón YV4KWT (`147.090 MHz`).\n- **Zulia (Costa Oriental):** YV1GDQ (ID 734015) en UHF `439.600 MHz` (-5.000 MHz), CC1.\n\nConsulta el mapa y telemetría en [brandmeisteryv.net/repetidores](https://brandmeisteryv.net/repetidores).",
            'sort_order' => 11,
            'is_published' => 1
        ],
        [
            'id' => 12,
            'category' => 'Repetidores y Cobertura',
            'question' => '¿Qué son los puntos de acceso comunitarios de alta potencia (Araure y La Boyera)?',
            'answer_markdown' => "Son estaciones base comunitarias con radios de 25 a 50 vatios y antenas omnidireccionales elevadas que operan en **frecuencia simplex VHF 146.550 MHz (CC1)** en **Araure (YV3ARO)** y en **La Boyera / El Hatillo (YV5FBP)**, permitiendo que cualquier radioaficionado con un radio portátil de mano acceda a la red BrandMeister sin tener un hotspot propio.",
            'sort_order' => 12,
            'is_published' => 1
        ],
        [
            'id' => 13,
            'category' => 'Hotspots y Equipos',
            'question' => '¿Qué es un Hotspot MMDVM (Pi-Star / OpenGD77 / WPSD) y cuándo necesito uno?',
            'answer_markdown' => "Un Hotspot es un micro-punto de acceso digital de baja potencia (10-20 mW) conectado a internet que emite en tu hogar o vehículo. Es ideal si vives fuera del radio de cobertura de los repetidores físicos o si deseas explorar salas y talkgroups internacionales.",
            'sort_order' => 13,
            'is_published' => 1
        ],
        [
            'id' => 14,
            'category' => 'Hotspots y Equipos',
            'question' => '¿Cuáles son las frecuencias y el servidor máster recomendados para hotspots en Venezuela?',
            'answer_markdown' => "- **Servidor Máster:** `7301.master.brandmeister.network` (BM Master Chile, mínima latencia hacia Venezuela).\n- **Frecuencia VHF Simplex:** `146.550 MHz` (CC1, Slot 2).\n- **Frecuencia UHF Simplex:** `436.550 MHz` (CC1, Slot 2).\n- **Contraseña:** Tu *Hotspot Security Password* configurada en el SelfCare de [brandmeister.network](https://brandmeister.network/).",
            'sort_order' => 14,
            'is_published' => 1
        ],
        [
            'id' => 15,
            'category' => 'Hotspots y Equipos',
            'question' => '¿Qué es un Codeplug y cómo lo descargo para mi radio (AnyTone, Baofeng, Retevis, OpenGD77)?',
            'answer_markdown' => "Es el archivo de configuración que carga en la memoria de tu radio todos los repetidores, talkgroups, canales y frecuencias oficiales. Puedes generar y descargar el tuyo listo para importar en [brandmeisteryv.net/generador-csv](https://brandmeisteryv.net/generador-csv).",
            'sort_order' => 15,
            'is_published' => 1
        ],
        [
            'id' => 16,
            'category' => 'Hotspots y Equipos',
            'question' => '¿Puedo escuchar las conversaciones de BrandMeister Venezuela sin tener radio (Hoseline / Petra)?',
            'answer_markdown' => "**Sí, de forma gratuita desde tu navegador web:**\n- **Audio en Vivo (Hoseline):** En [brandmeisteryv.net](https://brandmeisteryv.net) pulsa el botón de audio en la cabecera para escuchar el TG 734 en tiempo real.\n- **Telemetría Petra:** En [brandmeisteryv.net/petra](https://brandmeisteryv.net/petra) puedes ver quién está en el aire, duración y estadísticas de la red en directo.",
            'sort_order' => 16,
            'is_published' => 1
        ]
    ];
}

/**
 * Convierte un array de filas a un documento Markdown completo.
 */
function faqs_to_markdown(array $items): string {
    $out = "# Preguntas Frecuentes — BrandMeister Venezuela\n\n";
    $grouped = [];
    foreach ($items as $item) {
        $cat = trim($item['category'] ?? 'General');
        $grouped[$cat][] = $item;
    }
    foreach ($grouped as $cat => $faqs) {
        $out .= "## " . $cat . "\n\n";
        foreach ($faqs as $faq) {
            $q = trim($faq['question'] ?? '');
            $a = trim($faq['answer_markdown'] ?? '');
            if ($q === '') continue;
            $out .= "### " . $q . "\n\n" . $a . "\n\n";
        }
    }
    return trim($out) . "\n";
}

/**
 * Parsea un documento Markdown estructurado con ## Categoría y ### Pregunta.
 */
function markdown_to_faqs(string $markdown): array {
    $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $markdown));
    $items = [];
    $currentCategory = 'Conceptos Fundamentales';
    $currentQuestion = '';
    $answerLines = [];
    $sort = 1;

    $flush = function() use (&$items, &$currentCategory, &$currentQuestion, &$answerLines, &$sort) {
        $q = trim($currentQuestion);
        $a = trim(implode("\n", $answerLines));
        if ($q !== '' && $a !== '') {
            $items[] = [
                'category'        => $currentCategory,
                'question'        => $q,
                'answer_markdown' => $a,
                'sort_order'      => $sort++,
                'is_published'    => 1
            ];
        }
        $currentQuestion = '';
        $answerLines = [];
    };

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if (preg_match('/^##\s+(.+)$/', $trimmed, $m)) {
            $flush();
            $currentCategory = trim($m[1]);
            continue;
        }
        if (preg_match('/^###\s+(.+)$/', $trimmed, $m)) {
            $flush();
            $currentQuestion = trim($m[1]);
            continue;
        }
        if ($currentQuestion !== '') {
            $answerLines[] = $line;
        }
    }
    $flush();
    return $items;
}

// ============================================================================
// ENRUTAMIENTO DE PETICIONES
// ============================================================================

// 1. Exportar en formato Markdown plano
if ($method === 'GET' && isset($_GET['format']) && $_GET['format'] === 'md') {
    header('Content-Type: text/markdown; charset=utf-8');
    header('Cache-Control: no-cache');
    $items = [];
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM bm_faqs WHERE is_published = 1 ORDER BY category ASC, sort_order ASC, id ASC");
            $items = $stmt->fetchAll();
        } catch (Throwable $e) {}
    }
    if (empty($items)) {
        $items = faqs_default_fallback();
    }
    echo faqs_to_markdown($items);
    exit;
}

// 2. Consulta GET de FAQs (Pública o Admin)
if ($method === 'GET') {
    $isAdmin = isset($_GET['admin']) && $_GET['admin'] === '1';
    if ($isAdmin) {
        require_role(['admin', 'editor']);
    }

    $items = [];
    $fromDb = false;

    if ($pdo) {
        try {
            $where = $isAdmin ? "1=1" : "is_published = 1";
            $stmt  = $pdo->query("SELECT * FROM bm_faqs WHERE {$where} ORDER BY sort_order ASC, id ASC");
            $rows  = $stmt->fetchAll();
            if (!empty($rows)) {
                $items  = $rows;
                $fromDb = true;
            }
        } catch (Throwable $e) {
            // Si la tabla no existe aún, se usan los defaults sin romper
            $items = faqs_default_fallback();
        }
    } else {
        $items = faqs_default_fallback();
    }

    // Enriquecer con HTML procesado y agrupar
    $processed = [];
    $categories = [];

    foreach ($items as $item) {
        $cat = trim($item['category'] ?? 'General');
        if (!in_array($cat, $categories, true)) {
            $categories[] = $cat;
        }
        $md = (string)($item['answer_markdown'] ?? '');
        $processed[] = [
            'id'              => (int)($item['id'] ?? 0),
            'category'        => $cat,
            'question'        => trim((string)($item['question'] ?? '')),
            'answer_markdown' => $md,
            'answer_html'     => bm_markdown($md),
            'sort_order'      => (int)($item['sort_order'] ?? 0),
            'is_published'    => (int)($item['is_published'] ?? 1),
            'created_at'      => $item['created_at'] ?? date('Y-m-d H:i:s')
        ];
    }

    send_json([
        'success'    => true,
        'from_db'    => $fromDb,
        'total'      => count($processed),
        'categories' => $categories,
        'faqs'       => $processed,
        'raw_md'     => faqs_to_markdown($processed)
    ]);
}

// 3. Operaciones de Escritura POST (Solo Admin / Editor)
if ($method === 'POST') {
    $currentUser = require_role(['admin', 'editor']);
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

    // A. Guardar TODO el catálogo desde Markdown completo
    if ($action === 'save_all_md') {
        $md = trim((string)($input['markdown'] ?? ''));
        if ($md === '') {
            send_json(['success' => false, 'error' => 'El contenido Markdown no puede estar vacío'], 400);
        }

        $parsed = markdown_to_faqs($md);
        if (empty($parsed)) {
            send_json(['success' => false, 'error' => 'No se detectaron preguntas en el Markdown. Usa "## Categoría" y "### Pregunta"'], 400);
        }

        if (!$pdo) {
            send_json(['success' => false, 'error' => 'Base de datos no disponible'], 503);
        }

        try {
            $pdo->beginTransaction();

            // Asegurar que la tabla existe
            $pdo->exec("CREATE TABLE IF NOT EXISTS `bm_faqs` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `category` VARCHAR(100) NOT NULL,
                `question` VARCHAR(255) NOT NULL,
                `answer_markdown` MEDIUMTEXT NOT NULL,
                `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
                `is_published` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                INDEX `idx_faq_cat_pub_sort` (`category`, `is_published`, `sort_order`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // Reemplazo limpio y ordenado
            $pdo->exec("TRUNCATE TABLE `bm_faqs`");

            $ins = $pdo->prepare("INSERT INTO `bm_faqs` (`category`, `question`, `answer_markdown`, `sort_order`, `is_published`) VALUES (:cat, :q, :a, :sort, :pub)");
            foreach ($parsed as $item) {
                $ins->execute([
                    ':cat'  => $item['category'],
                    ':q'    => $item['question'],
                    ':a'    => $item['answer_markdown'],
                    ':sort' => $item['sort_order'],
                    ':pub'  => $item['is_published']
                ]);
            }

            $pdo->commit();
            send_json([
                'success' => true,
                'message' => 'Catálogo de Preguntas Frecuentes guardado exitosamente',
                'count'   => count($parsed)
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('[BM-YV faqs save_all_md] ' . $e->getMessage());
            send_json(['success' => false, 'error' => 'Error al guardar en la base de datos: ' . $e->getMessage()], 500);
        }
    }

    // B. Guardar o Editar una pregunta individual
    if ($action === 'save_item') {
        $id       = (int)($input['id'] ?? 0);
        $category = trim((string)($input['category'] ?? 'General'));
        $question = trim((string)($input['question'] ?? ''));
        $answerMd = trim((string)($input['answer_markdown'] ?? ''));
        $sort     = (int)($input['sort_order'] ?? 0);
        $isPub    = isset($input['is_published']) ? (int)(bool)$input['is_published'] : 1;

        if ($question === '' || $answerMd === '') {
            send_json(['success' => false, 'error' => 'La pregunta y la respuesta son obligatorias'], 400);
        }

        try {
            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE bm_faqs SET category = :cat, question = :q, answer_markdown = :a, sort_order = :sort, is_published = :pub WHERE id = :id");
                $stmt->execute([':cat' => $category, ':q' => $question, ':a' => $answerMd, ':sort' => $sort, ':pub' => $isPub, ':id' => $id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO bm_faqs (category, question, answer_markdown, sort_order, is_published) VALUES (:cat, :q, :a, :sort, :pub)");
                $stmt->execute([':cat' => $category, ':q' => $question, ':a' => $answerMd, ':sort' => $sort, ':pub' => $isPub]);
                $id = (int)$pdo->lastInsertId();
            }

            send_json(['success' => true, 'id' => $id]);
        } catch (Throwable $e) {
            send_json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // C. Alternar estado publicado / borrador
    if ($action === 'toggle') {
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) send_json(['success' => false, 'error' => 'ID inválido'], 400);

        try {
            $stmt = $pdo->prepare("UPDATE bm_faqs SET is_published = 1 - is_published WHERE id = :id");
            $stmt->execute([':id' => $id]);
            send_json(['success' => true]);
        } catch (Throwable $e) {
            send_json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // D. Eliminar pregunta
    if ($action === 'delete') {
        $id = (int)($input['id'] ?? 0);
        if ($id <= 0) send_json(['success' => false, 'error' => 'ID inválido'], 400);

        try {
            $stmt = $pdo->prepare("DELETE FROM bm_faqs WHERE id = :id");
            $stmt->execute([':id' => $id]);
            send_json(['success' => true]);
        } catch (Throwable $e) {
            send_json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    send_json(['success' => false, 'error' => 'Acción no reconocida'], 400);
}

send_json(['success' => false, 'error' => 'Método no permitido'], 405);

