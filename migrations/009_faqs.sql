-- ====================================================================
-- Migración 009: Tabla de Preguntas Frecuentes (FAQ) en Markdown
-- Permite gestionar y enriquecer el catálogo de dudas técnicas de DMR
-- para indexación SEO (Schema.org FAQPage) y edición rápida desde el panel.
-- ====================================================================

CREATE TABLE IF NOT EXISTS `bm_faqs` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Datos Iniciales Verificados (Técnicamente Rigurosos, Cero Alucinaciones)
-- ====================================================================

INSERT INTO `bm_faqs` (`category`, `question`, `answer_markdown`, `sort_order`, `is_published`) VALUES
-- Categoría 1: Conceptos Fundamentales y Operación
('Conceptos Fundamentales', '¿Es necesario tener internet para usar DMR?',
'**No, no es obligatorio tener internet para usar DMR.**

El estándar **DMR (Digital Mobile Radio Tier II)** es, ante todo, un protocolo de **radiofrecuencia pura (RF)**. Dos radios portátiles o móviles DMR transmiten y reciben paquetes de voz digital modulados en **4FSK** directamente por el aire, de equipo a equipo, exactamente igual que un radio analógico en FM.

Existen tres formas principales de operar DMR:

1. **Modo Directo / Simplex (Radio a Radio sin Internet):**
   Dos o más operadores en una montaña, en carretera o en una zona de emergencia sin cobertura celular ni electricidad pueden comunicarse en cualquier frecuencia simplex autorizada (como `146.550 MHz` en VHF o `436.550 MHz` en UHF) sin requerir internet, sin repetidor y sin servidor alguno.

2. **A través de Repetidores Físicos Locales (RF Pura):**
   Si te encuentras dentro del área de cobertura de un repetidor físico (por ejemplo, en Caracas con **YV5DMR** en VHF o **YV5VE** en UHF), tu radio se comunica por ondas de radio directas con la torre del cerro. Incluso si el repetidor perdiera su conexión de fibra o enlace satelital a internet, los operadores locales pueden continuar comunicándose entre sí a través del repetidor por RF.

3. **¿Cuándo SÍ se utiliza internet?:**
   Internet interviene únicamente como **medio de transporte troncal (Backhaul IP)** en dos escenarios:
   - Para interconectar repetidores ubicados en diferentes ciudades o países (la red mundial **BrandMeister**).
   - Cuando el operador se encuentra en una zona sin repetidores cercanos y utiliza un **Hotspot personal (MMDVM / Pi-Star)** en su casa para enrutar su señal de radio hacia los servidores de la red.', 1, 1),

('Conceptos Fundamentales', '¿Puedo comunicarme entre un radio analógico y uno digital DMR en la misma frecuencia?',
'**No de forma directa por radiofrecuencia.**

Aunque ambos radios operen en la misma frecuencia exacta (por ejemplo, `146.550 MHz`), el tipo de modulación es completamente distinto:
- El radio analógico modula la voz en **Frecuencia Modulada (FM convencional)**.
- El radio DMR modula un flujo continuo de datos digitales binarios en **4FSK** (4-Level Frequency Shift Keying) codificado por el vocoder **AMBE+2**.

Si un radio DMR transmite en una frecuencia analógica:
- El usuario del radio analógico solo escuchará un chirrido constante o ruido digital similar a un módem antiguo.
- El radio DMR ignorará la señal analógica a menos que tenga activada una función de recepción mixta (*Auto-Detect / Mixed Mode*).

**Excepción:** Algunos repetidores y sistemas de enlace avanzados cuentan con pasarelas o transcodificadores analógico-digitales (puentes como EchoLink, AllStarLink o enlaces analógicos en repetidores mixtos) configurados por los Sysops para cruzar ambos mundos.', 2, 1),

('Conceptos Fundamentales', '¿Por qué la batería de un radio dura hasta un 40% más en DMR que en analógico?',
'En FM analógica, cuando pulsas el PTT (Push-To-Talk), el transmisor de potencia del radio emite radiación de forma 100% continua e ininterrumpida durante toda tu intervención.

En **DMR Tier II**, gracias a la tecnología **TDMA (Time Division Multiple Access)**, el canal de 12.5 kHz se divide en dos ranuras de tiempo (*Time Slots*):
- Cada ranura dura exactamente **30 milisegundos**.
- Cuando transmites en Slot 1, tu radio enciende la etapa de amplificación de potencia durante 30 ms y **la apaga por completo durante los siguientes 30 ms** mientras corresponde el turno al Slot 2.

Este ciclo de trabajo alternado del **50% de encendido / 50% de apagado** reduce drásticamente el consumo eléctrico y la disipación térmica del transceptor, prolongando la autonomía de la batería hasta un 40% en comparación con una transmisión analógica equivalente.', 3, 1),

('Conceptos Fundamentales', '¿Qué es la regla de los 3 segundos en DMR y por qué es obligatoria?',
'La regla de los 3 segundos es la norma de etiqueta y disciplina operativa más importante en las redes digitales enlazadas por IP:

**Consiste en esperar al menos 3 segundos después de que tu corresponsal suelta el PTT antes de comenzar a hablar tú.**

Razones técnicas fundamentales:
1. **Sincronización de Enlaces IP:** Los repetidores y servidores distribuidos BrandMeister necesitan una fracción de segundo para que las tramas de datos UDP/IP liberen la cola del repetidor y se desconecten limpiamente.
2. **Prioridad y Emergencias:** Si dos estaciones se responden de inmediato "a quemarropa", cierran el canal e impiden que una estación en situación de urgencia o desastre (como tráfico de la Red Nacional de Emergencia YV5RNE en TG 734911) pueda interrumpir para solicitar auxilio.
3. **Evitar colisiones:** En DMR no existe el "pisar" o modular sobre otra estación; si dos personas transmiten simultáneamente, ambas señales digitales se anulan y se produce silencio o pérdida total de tramas.', 4, 1),

('Conceptos Fundamentales', '¿Cómo funciona el canal de eco / Parrot (9990) para probar mi transmisión?',
'El canal de eco (también conocido como **Parrot** o loro telemétrico) permite verificar la calidad de tu modulación, nivel de volumen y estabilidad de conexión sin interrumpir a otros operadores en los canales de conversación:

**Instrucciones para usar el Parrot:**
1. En tu radio, selecciona o crea un contacto configurado como **Llamada Privada (Private Call)** al número **`9990`**.
2. En tu repetidor local o hotspot, pulsa el PTT en la ranura correspondiente (Slot 2 en hotspots o Slot 1/2 según repetidor).
3. Transmite una prueba breve identificándote: *"YV5XXX haciendo prueba de modulación y audio en canal 9990"*.
4. Suelta el PTT. El servidor BrandMeister grabará tu voz y te la reproducirá de vuelta de forma idéntica segundos después.

Si te escuchas con audio claro y sin cortes, tu transmisor, nivel de ganancia de micrófono (Mic Gain) y parámetros de red están perfectamente ajustados.', 5, 1),

-- Categoría 2: Arquitectura de Red (Slots, Talkgroups y Color Code)
('Arquitectura de Red', '¿Cuál es la diferencia técnica entre Time Slot 1 (TS1) y Time Slot 2 (TS2) en DMR?',
'DMR divide una misma frecuencia portadora de 12.5 kHz en dos canales virtuales independientes utilizando ranuras de tiempo (**Time Slots**):

- **Time Slot 1 (TS1 - Ranura 1):**
  En BrandMeister Venezuela está reservada por convención para **tráfico nacional e internacional de amplia cobertura**. Aquí operan:
  - **TG 734** (Canal Nacional de Venezuela).
  - **TG 734911** (Canal oficial de Emergencias EMCOM / YV5RNE).
  - Canales mundiales (TG 91) e iberoamericanos (TG 913).

- **Time Slot 2 (TS2 - Ranura 2):**
  Reservada para **tráfico regional, local y puntos de acceso**:
  - Los 9 Circuitos Regionales de Venezuela (TG 7341 al TG 7349).
  - Radio Club Venezolano (TG 73473) y emisiones técnicas (TG 73452).
  - Canales de desborde táctico (TG 7340 y TG 73499).
  - Puntos de acceso personales (hotspots residenciales).

Esta separación permite que, por ejemplo, en Caracas dos colegas mantengan una conversación local en Slot 2 sin bloquear ni interrumpir una llamada nacional que se esté desarrollando en Slot 1 en el mismo repetidor.', 6, 1),

('Arquitectura de Red', '¿Qué es un Talkgroup (TG) y cómo funciona la activación estática vs dinámica?',
'Un **Talkgroup (TG)** es un canal o grupo de conversación virtual identificado por un número numérico. En lugar de cambiar de frecuencia en tu radio, seleccionas un Talkgroup para determinar con quién te comunicas:

Existen dos modalidades de Talkgroups en la red BrandMeister:

1. **Talkgroups Estáticos (Static):**
   Son canales que están permanentemente "escuchando" en el repetidor o hotspot. Cualquier transmisión que ocurra en ese TG a nivel nacional o mundial abrirá automáticamente el repetidor sin que tengas que hacer nada. En Venezuela, el **TG 734** está anclado estáticamente en todos los repetidores oficiales.

2. **Talkgroups Dinámicos o "Bajo Demanda" (Dynamic / On-Demand):**
   Son canales que no transmiten audio en el repetidor hasta que un operador local pulsa el PTT en ese TG durante 1 segundo. Al hacer esto, el servidor "enlaza" el grupo al repetidor durante un periodo de inactividad de **10 a 15 minutos**. Si nadie vuelve a hablar en ese tiempo, el enlace se desconecta automáticamente para liberar el repetidor.', 7, 1),

('Arquitectura de Red', '¿Cuándo y cómo debo hacer QSY (cambio de canal) desde el Talkgroup 734?',
'El **TG 734** es el canal nacional de encuentro y llamada general (CQ) de Venezuela. Abre simultáneamente decenas de repetidores y cientos de hotspots en todo el país.

**Protocolo de QSY (Paso a Canal de Conversación):**
1. Realizas tu llamada general en TG 734: *"CQ CQ CQ Venezuela, aquí YV5XXX en Caracas a la escucha"*.
2. Tu corresponsal te responde y se saludan brevemente.
3. Si el contacto superará los 2 a 3 minutos, invitas cordialmente a tu corresponsal a pasar a un circuito regional en Slot 2:
   *"Colega, pasemos al Circuito 5 (TG 7345) o al Táctico 1 (TG 7340) en Slot 2 para liberar la nacional"*.
4. Ambos cambian de canal en sus radios a la ranura 2 y continúan su QSO cómodamente sin monopolizar el canal de todo el país.', 8, 1),

('Arquitectura de Red', '¿Qué es el Color Code (CC) y por qué usamos Color Code 1 (CC1) en toda Venezuela?',
'El **Color Code (Código de Color)** es un identificador numérico entre 0 y 15 que cumple en DMR la misma función que el subtono CTCSS o DCS en los repetidores analógicos.

**¿Para qué sirve?:**
Permite que dos repetidores instalados en cerros distantes que compartan la misma frecuencia de radio no se interfieran mutuamente si tienen asignados códigos de color distintos. Tu radio solo abrirá el receptor cuando el código de color coincida con el programado.

**Estándar en Venezuela:**
En toda la red BrandMeister Venezuela se ha unificado el **Color Code 1 (CC1)** como estándar nacional para repetidores y hotspots. Esto simplifica enormemente la programación de los radios y codeplugs comunitarios.', 9, 1),

-- Categoría 3: Repetidores Físicos y Cobertura Nacional
('Repetidores y Cobertura', '¿Cómo me conecto a los repetidores DMR de Caracas (YV5DMR en VHF y YV5VE en UHF)?',
'En la Gran Caracas operan dos sistemas repetidores de gran cobertura:

1. **Repetidor YV5DMR (ID 734500) — Banda VHF:**
   - **Frecuencia TX Repetidor (tu RX):** `147.240 MHz`
   - **Frecuencia RX Repetidor (tu TX):** `147.840 MHz`
   - **Offset / Desplazamiento:** `+0.600 MHz`
   - **Color Code:** `CC1`
   - **Cobertura:** Emplazamiento pionero en el Cerro El Ávila con cobertura en toda la Gran Caracas, Valles del Tuy y accesos viales.

2. **Repetidor YV5VE (ID 734014) — Banda UHF:**
   - **Frecuencia TX Repetidor (tu RX):** `439.600 MHz`
   - **Frecuencia RX Repetidor (tu TX):** `434.600 MHz`
   - **Offset / Desplazamiento:** `-5.000 MHz`
   - **Color Code:** `CC1`
   - **Cobertura:** Excelente penetración urbana e interiores en el valle metropolitano de Caracas.', 10, 1),

('Repetidores y Cobertura', '¿Qué repetidores cubren Valencia, La Guaira, los Llanos y el Occidente de Venezuela?',
'La red BrandMeister Venezuela cuenta con repetidores activos en emplazamientos estratégicos:

- **La Guaira (Litoral Central):** Repetidor **YV5CBO** (ID 734016) en VHF `147.150 MHz` (+0.600 MHz), CC1.
- **Valencia / Carabobo (Región Central):** Repetidor **YV4EGG** (ID 734013) en VHF `146.700 MHz` (-0.600 MHz), CC1.
- **Altagracia de Orituco (Guárico):** Repetidor **YV5VE** (ID 734009) en VHF `147.390 MHz` (+0.600 MHz), CC1.
- **Cerro Portachuelo (Guárico):** Repetidor **YV5VE** (ID 734012) en VHF `146.820 MHz` (-0.600 MHz), CC1.
- **Cerro Platillón (Guárico):** Repetidor local **YV4KWT** (ID 734004) en VHF `147.090 MHz` (+0.600 MHz), CC1.
- **Ciudad Ojeda / Costa Oriental del Lago (Zulia):** Repetidor **YV1GDQ** (ID 734015) en UHF `439.600 MHz` (-5.000 MHz), CC1.

Puedes consultar el estado en tiempo real y la telemetría de cada repetidor en [https://brandmeisteryv.net/repetidores](https://brandmeisteryv.net/repetidores).', 11, 1),

('Repetidores y Cobertura', '¿Qué son los puntos de acceso comunitarios de alta potencia (Araure y La Boyera)?',
'A diferencia de un hotspot doméstico de 20 milivatios, los **puntos de acceso comunitarios de alta potencia** son estaciones base instaladas con transceptores comerciales de 25 a 50 vatios y antenas omnidireccionales de alta ganancia en sitios elevados:

- **Araure / Portuguesa (YV3ARO - ID 734026401):** Opera en frecuencia simplex VHF `146.550 MHz` (CC1) con cobertura en toda el área metropolitana de Acarigua y Araure.
- **La Boyera / El Hatillo (YV5FBP - ID 734046205):** Opera en frecuencia simplex VHF `146.550 MHz` (CC1) cubriendo el sureste de Caracas, El Hatillo y sectores de los Altos Mirandinos.

Permiten que cualquier radioaficionado con un radio portátil de mano (HT) pueda conectarse a la red BrandMeister en simplex sin necesidad de tener un hotspot propio.', 12, 1),

-- Categoría 4: Hotspots Personales y Equipos
('Hotspots y Equipos', '¿Qué es un Hotspot MMDVM (Pi-Star / OpenGD77 / WPSD) y cuándo necesito uno?',
'Un **Hotspot** es un micro-repetidor digital personal de muy baja potencia (típicamente 10 a 20 mW) para uso doméstico o vehicular. Se compone de una placa módem MMDVM conectada a una Raspberry Pi o integrada en radios con firmwares libres como OpenGD77.

**¿Cuándo lo necesitas?:**
1. Si vives en una zona donde la topografía o la distancia te impiden alcanzar con tu radio portátil los repetidores físicos de tu región.
2. Si deseas experimentar con múltiples talkgroups internacionales o salas temáticas sin ocupar el repetidor físico comunitario de tu ciudad.
3. Para operaciones en movimiento o expediciones de campo conectándolo a la zona Wi-Fi de tu teléfono celular.', 13, 1),

('Hotspots y Equipos', '¿Cuáles son las frecuencias y el servidor máster recomendados para hotspots en Venezuela?',
'Para configurar tu hotspot (Pi-Star, WPSD o MMDVM) en Venezuela, utiliza los parámetros estándar de coordinación:

- **Servidor Máster Recomendado:** `7301.master.brandmeister.network` (BM Master Chile, anfitrión con latencia inferior a 80 ms para conexiones venezolanas) o `BM_Venezuela_734`.
- **Frecuencia Simplex VHF (2 Metros):** `146.550 MHz`
- **Frecuencia Simplex UHF (70 Centímetros):** `436.550 MHz`
- **Código de Color:** `Color Code 1 (CC1)`
- **Time Slot:** `Slot 2 (TS2)` (estándar para nodos simplex personales)
- **Contraseña:** Tu *Hotspot Security Password* configurada en el Self-Care de [brandmeister.network](https://brandmeister.network/).', 14, 1),

('Hotspots y Equipos', '¿Qué es un Codeplug y cómo lo descargo para mi radio (AnyTone, Baofeng, Retevis, OpenGD77)?',
'El **Codeplug** es el archivo que contiene la configuración completa de tu radio: lista de canales, frecuencias de repetidores, códigos de color, ranuras de tiempo, contactos de llamada (Talkgroups) y zonas geográficas.

En lugar de programar cientos de parámetros a mano en el teclado de tu radio, BrandMeister Venezuela ofrece un **Generador de Archivos CSV y Codeplugs Oficial**:
1. Ingresa a [https://brandmeisteryv.net/generador-csv](https://brandmeisteryv.net/generador-csv).
2. Selecciona la marca y modelo de tu radio (AnyTone AT-D878UV, Baofeng DM-32UV/DM-1701, Retevis RT3S, TYT MD-UV380, OpenGD77 o Motorola).
3. Descarga el archivo CSV generado e impórtalo directamente en el CPS (Customer Programming Software) de tu equipo.', 15, 1),

('Hotspots y Equipos', '¿Puedo escuchar las conversaciones de BrandMeister Venezuela sin tener radio (Hoseline / Petra)?',
'**Sí, de dos formas muy sencillas y gratuitas directamente desde tu navegador web:**

1. **Hoseline Integrado en la Web:**
   En el portal [https://brandmeisteryv.net](https://brandmeisteryv.net) dispones en la barra superior y en el dock flotante de un botón de reproducción en vivo que conecta con el flujo de audio digital del **TG 734 Nacional**. Puedes escuchar a los operadores en tiempo real desde tu teléfono móvil o computadora.

2. **Monitor Petra en Tiempo Real:**
   En [https://brandmeisteryv.net/petra](https://brandmeisteryv.net/petra) puedes ver el registro telemétrico en vivo (Last Heard): qué indicativo está hablando, duración de la transmisión, porcentaje de paquetes recibidos y el estado de conexión de todos los repetidores del país.', 16, 1)

ON DUPLICATE KEY UPDATE
  `category` = VALUES(`category`),
  `question` = VALUES(`question`),
  `answer_markdown` = VALUES(`answer_markdown`),
  `sort_order` = VALUES(`sort_order`),
  `is_published` = VALUES(`is_published`);

