-- ====================================================================
-- Migración 003: el blog público pasa a leerse desde MySQL
-- Copia a la base de datos el texto completo de las noticias que vivían en
-- archivos Markdown dentro del repositorio. Ejecutar una vez en phpMyAdmin.
-- Es segura de repetir (solo actualiza esas cuatro noticias por su slug).
-- ====================================================================

UPDATE `bm_posts` SET `content` = 'Los puntos de acceso personales (**Hotspots**) basados en placas MMDVM y sistemas como **Pi-Star** o **WPSD** han democratizado el acceso a la voz digital en Venezuela. Para asegurar que tu nodo opere con la máxima estabilidad y sin generar colisiones con la red nacional, te presentamos los parámetros de configuración oficial.

### 1. Elección de la Frecuencia de Operación

Es crucial utilizar frecuencias del segmento asignado a voz digital y simplex:

- **Banda de VHF:** `146.550 MHz` (Alternativa: `146.490 MHz`)
- **Banda de UHF:** `436.550 MHz` (Alternativa: `436.490 MHz`)
- **Código de Color (Color Code):** Utiliza siempre `CC1` salvo que tengas razones locales específicas.

### 2. Selección del Servidor Máster BrandMeister

En el panel de configuración de tu hotspot, dirígete a la sección de **DMR Configuration** y selecciona:

- **Servidor Primario:** `BM_3341_Mexico` (óptima latencia y estabilidad para Venezuela)
- **Servidor Secundario / Contingencia:** `BM_7301_Chile`
- **DMR Master Password:** La contraseña de seguridad (Security Password) que hayas configurado previamente en tu cuenta de **BrandMeister SelfCare** (https://brandmeister.network/).

### 3. Talkgroups Estáticos vs. Dinámicos

Para tu hotspot personal se recomienda no saturar la recepción con demasiados grupos estáticos:

- Configura el **TG 734** como estático si deseas escuchar permanentemente el tráfico nacional venezolano.
- Utiliza la función de activación dinámica (PTT de 1 segundo) para ingresar a los circuitos regionales (`7341` al `7349`) o talkgroups internacionales cuando lo requieras. Tras 10 a 15 minutos de inactividad, el servidor liberará el canal dinámico automáticamente.

Recuerda mantener una separación adecuada de antena respecto a tus transceptores base y verificar en el dashboard de Pi-Star que tu BER (Bit Error Rate) sea inferior al 0.5%.', `created_at` = '2026-08-05 12:00:00', `read_time` = '6 min de lectura'
WHERE `slug` = 'configuracion-hotspots-dmr-venezuela';

UPDATE `bm_posts` SET `content` = 'El proyecto **Petra** nació como una iniciativa tecnológica comunitaria dentro de **BrandMeister Venezuela** con el firme propósito de ofrecer a los radioaficionados una ventana transparente, en tiempo real y visualmente intuitiva sobre el comportamiento del **Talkgroup Nacional 734**.

Disponible públicamente en [petra.brandmeisteryv.net](https://petra.brandmeisteryv.net/), la herramienta ha evolucionado hasta convertirse en un punto de referencia diario para operadores en Venezuela y en el extranjero.

### ¿Qué problemas resuelve Petra?

Tradicionalmente, para conocer si un repetidor o un talkgroup presentaba congestión o actividad reciente, el operador dependía únicamente de encender su equipo receptor o revisar manualmente registros extensos. Petra simplifica este proceso mediante:

1. **Mapa de Calor de Ocupación:** Representa gráficamente las horas pico y valles de transmisión a lo largo de cada semana. Desde periodos de silencio absoluto hasta momentos de máxima ocupación, permitiendo planificar ruedas, contactos o boletines sin saturar el canal.
2. **Salud del Anunciador Automático:** Verifica el estado operativo de los avisos de voz que identifican periódicamente el canal nacional y su sincronización con los servidores máster.
3. **Registro de Últimas Transmisiones:** Proporciona un feed inmediato de los indicativos que han presionado PTT (Push-To-Talk) en el TG 734, facilitando la identificación de corresponsales.

### Arquitectura Liviana y Enfoque Moderno

Diseñada con un stack de alto rendimiento y bajo consumo de datos, Petra garantiza que cualquier usuario conectado mediante redes móviles o enlaces satelitales pueda cargar las métricas en milisegundos.

Invitamos a toda la comunidad a visitar periódicamente [petra.brandmeisteryv.net](https://petra.brandmeisteryv.net/) y a compartir sus sugerencias para seguir enriqueciendo las estadísticas de nuestra red.', `created_at` = '2026-08-20 12:00:00', `read_time` = '5 min de lectura'
WHERE `slug` = 'petra-telemetria-tg734';

UPDATE `bm_posts` SET `content` = 'El servicio de radioaficionados cumple su misión más noble cuando los sistemas comerciales de telecomunicaciones fallan ante fenómenos naturales o desastres de gran magnitud. En la red **BrandMeister Venezuela**, disponemos de una estructura jerárquica de canales para gestionar este tráfico con total disciplina.

### Canal Prioritario: TG 734911 (Slot 1)

El **TG 734911** está estrictamente reservado para:

- Alertas y boletines tempranos ante ondas tropicales, huracanes, sismos o inundaciones.
- Tráfico formal de socorro y bienestar (Health & Welfare) coordinado por la **Red Nacional de Emergencia (YV5RNE)**.
- Enlace entre puestos de comando de auxilio y radioaficionados en zonas afectadas.

### Reglas Clave para Todos los Operadores

1. **Mantener Silencio de Radio:** Cuando se declare una activación de emergencia en el TG 734911 o en el canal nacional 734, no transmita a menos que tenga información de primera mano o auxilio que reportar.
2. **RX List en Repetidores:** Se recomienda a todos los radioaficionados programar el TG 734911 en la lista de recepción (RX Group List) de todos los canales de repetidores en el **Slot 1**. Esto garantiza que si una emergencia se declara, usted escuchará el llamado de inmediato.
3. **Canal de Soporte Interno: TG 73452 (Slot 2):** Se utiliza para coordinaciones logísticas y técnicas de los operadores de la red de emergencia, evitando congestionar el canal de llamada principal.

A través del **Radio Club Venezolano** y las filiales regionales, continuaremos realizando simulacros periódicos para verificar la cobertura de los repetidores y la preparación de los operadores.', `created_at` = '2026-07-18 12:00:00', `read_time` = '4 min de lectura'
WHERE `slug` = 'red-emergencia-tg734911';

UPDATE `bm_posts` SET `content` = 'Los identificadores numéricos de 7 dígitos utilizados en DMR y otras redes digitales de radioaficionados son un recurso finito administrado a nivel global por la organización sin fines de lucro **RadioID.net**.

Debido al crecimiento exponencial de la voz digital en los últimos años, RadioID implementó un protocolo periódico de confirmación anual para evitar el desperdicio de números asignados y asegurar que la base de datos se mantenga depurada.

### ¿Cómo funciona la verificación?

- **Fecha de Aniversario:** En la fecha de creación de tu cuenta, RadioID enviará un correo electrónico de notificación a la dirección registrada.
- **Acción requerida:** Solo debes iniciar sesión en [RadioID.net](https://radioid.net/) y confirmar con un clic que tu indicativo sigue vigente y que sigues requiriendo los IDs asignados.
- **Plazos de gracia:** Si no se confirma en el plazo estipulado, el ID pasará temporalmente a estado inactivo. Si no hay respuesta tras el periodo de gracia extendido, el identificador será liberado para reasignación.

### Recomendaciones para los radioaficionados venezolanos

1. Verifica que tu dirección de correo en RadioID.net sea válida y accesible.
2. Si has cambiado de indicativo o actualizado tu licencia ante CONATEL, actualiza tu certificado oficial escaneado en el portal de RadioID.
3. No solicites múltiples IDs a menos que tengas necesidades operativas comprobables (como un repetidor físico propio o un vehículo con estación móvil dedicada).

Mantener nuestra información al día asegura que la red BrandMeister Venezuela funcione sin colisiones y con perfecta identificación en las pantallas de todos los colegas.', `created_at` = '2026-06-25 12:00:00', `read_time` = '3 min de lectura'
WHERE `slug` = 'verificacion-radioid-dmr';
