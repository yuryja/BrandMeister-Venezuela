# Preguntas Frecuentes — BrandMeister Venezuela

## Conceptos Fundamentales

### ¿Es necesario tener internet para usar DMR?

**No, no es obligatorio tener internet para usar DMR.**

El estándar **DMR (Digital Mobile Radio Tier II)** es, ante todo, un protocolo de **radiofrecuencia pura (RF)**. Dos radios portátiles o móviles DMR transmiten y reciben paquetes de voz digital modulados en **4FSK** directamente por el aire, de equipo a equipo, exactamente igual que un radio analógico tradicional en FM.

- **Modo Directo / Simplex (Radio a Radio sin Internet):** Dos o más operadores en una montaña, en carretera o en una zona de emergencia sin cobertura celular ni electricidad pueden comunicarse en cualquier frecuencia simplex autorizada (como `146.550 MHz` en VHF o `436.550 MHz` en UHF) sin requerir internet, sin repetidor y sin servidor alguno.
- **A través de Repetidores Físicos Locales (RF Pura):** Si te encuentras dentro del área de cobertura de un repetidor físico (por ejemplo, en Caracas con **YV5DMR** en VHF o **YV5VE** en UHF), tu radio se comunica por ondas de radio directas con la torre del cerro. Incluso si el repetidor perdiera su conexión a internet por corte de fibra o falla eléctrica, los operadores locales pueden continuar comunicándose entre sí a través del repetidor por RF en su cobertura geográfica.
- **¿Cuándo SÍ se utiliza internet?:** Internet interviene únicamente como **medio de transporte troncal (Backhaul IP)** para interconectar repetidores distantes entre ciudades o países (la red mundial BrandMeister) o cuando el operador utiliza en su casa un **Hotspot personal (MMDVM / Pi-Star)** para enlazarse a los servidores centrales.

---

### ¿Puedo comunicarme entre un radio analógico y uno digital DMR en la misma frecuencia?

**No de forma directa por radiofrecuencia.**

Aunque ambos radios estén sintonizados en la misma frecuencia exacta (por ejemplo, `146.550 MHz`), el tipo de modulación y procesamiento es completamente distinto:
- El radio analógico modula la portadora en **FM convencional**.
- El radio DMR modula un flujo binario en **4FSK** codificado por el vocoder **AMBE+2**.

Si transmites en DMR y alguien escucha en analógico, solo oirá un zumbido digital continuo de datos (similar a un módem telefónico). Para cruzarlos se requieren repetidores híbridos o pasarelas IP configuradas expresamente para realizar la transcodificación de audio.

---

### ¿Por qué la batería de un radio dura hasta un 40% más en DMR que en analógico?

En FM analógica, la etapa final de potencia de tu radio emite radiación de manera ininterrumpida durante el 100% del tiempo que mantengas presionado el PTT.

En **DMR Tier II**, gracias a la tecnología **TDMA (Time Division Multiple Access)**, el canal se divide en dos ranuras de tiempo independientes de **30 milisegundos**:
1. Cuando transmites en Time Slot 1, tu radio enciende su transmisor durante 30 ms.
2. **Apaga completamente el transmisor durante los siguientes 30 ms** mientras corresponde el turno al Time Slot 2.

Este ciclo de trabajo del **50% activo / 50% reposo** a nivel de milisegundos reduce drásticamente el consumo de corriente y la temperatura del transmisor, permitiendo que la batería rinda entre un 35% y un 40% más en comparación con una transmisión continua en FM a la misma potencia.

---

### ¿Qué es la regla de los 3 segundos en DMR y por qué es obligatoria?

Consiste en esperar al menos **tres (3) segundos** después de que tu corresponsal suelta el PTT antes de comenzar a responder.

Esta buena práctica técnica es indispensable por tres razones:
1. **Desenganche de repetidores y reflectores:** Permite que los servidores BrandMeister y los repetidores físicos liberen las ranuras TDMA y restablezcan sus buffers de enlace.
2. **Ventana de prioridad para emergencias:** Concede el intervalo de tiempo necesario para que estaciones con tráfico urgente o prioritario (como la **Red Nacional de Emergencia YV5RNE en TG 734911**) puedan identificarse e interrumpir.
3. **Prevención de colisiones digitales:** En DMR, si dos personas transmiten al mismo tiempo en el mismo Slot y Talkgroup, las tramas digitales no se mezclan como en analógico: se anulan mutuamente y se produce silencio o paquetes corruptos.

---

### ¿Cómo funciona el canal de eco o Parrot (ID 9990) para probar modulación?

El servicio **Parrot (Loro)** permite comprobar la calidad de tu audio, nivel de modulación y conectividad sin ocupar un canal de conversación ni molestar a otros colegas:

1. En tu radio, selecciona o digita una **Llamada Privada (Private Call)** al número de ID **`9990`**.
2. Pulsa el PTT en tu repetidor o hotspot, identifícate claramente y habla durante 5 a 10 segundos: *"YV5XXX haciendo prueba técnica de modulación para el servicio de eco"*.
3. Suelta el PTT. El servidor BrandMeister grabará tus paquetes de voz y, un par de segundos después, te devolverá tu propia transmisión exactamente como te escuchan los demás operadores de la red.

---

### ¿Qué es el Radio ID de 7 dígitos y por qué empieza por 734 en Venezuela?

El **Radio ID** es tu número de identificación digital único e intransferible en la red DMR mundial, asignado por el consorcio internacional [RadioID.net](https://radioid.net).

Sigue el estándar de códigos móviles de país (MCC de la UIT):
- El prefijo internacional asignado a **Venezuela es el 734**.
- A este prefijo se le añaden cuatro dígitos que identifican al operador (por ejemplo, `7340001` a `7349999`).
- Para estaciones repetidoras oficiales, se utilizan identificadores de 6 dígitos (por ejemplo, `734500` para YV5DMR).

Cada vez que pulsas el PTT, tu radio envía este número en la cabecera digital, permitiendo que la red y las pantallas de los demás colegas muestren tu indicativo oficial y tu nombre.

---

## Arquitectura de Red y Talkgroups

### ¿Cuál es la diferencia técnica entre Time Slot 1 (TS1) y Time Slot 2 (TS2)?

DMR divide una frecuencia física de 12.5 kHz en dos canales virtuales de voz simultáneos llamados **Time Slots (Ranuras de Tiempo)**. En la red BrandMeister Venezuela, su uso está estandarizado operativamente:

- **Time Slot 1 (TS1 - Cobertura Troncal y Nacional):**
  - **TG 734:** Canal Nacional Oficial de Venezuela (Encuentro y Llamada).
  - **TG 734911:** Canal Prioritario de Emergencias (EMCOM / YV5RNE).
  - Canales internacionales y mundiales (ej. TG 91 Worldwide, TG 913 Hispanohablante).
- **Time Slot 2 (TS2 - Tráfico Local, Regional y Hotspots):**
  - **TG 7341 a TG 7349:** Los 9 Circuitos Regionales venezolanos.
  - **TG 73473:** Canal Institucional del Radio Club Venezolano.
  - **TG 7340 y TG 73499:** Canales tácticos para QSOs extensos.
  - Todo el tráfico de hotspots personales en frecuencias simplex.

Respetar esta división asegura que una conversación regional o personal nunca bloquee el canal nacional de emergencias ni el tráfico troncal entre estados.

---

### ¿Qué es un Talkgroup (TG) y cómo funciona la activación estática vs dinámica?

Un **Talkgroup (TG)** es una sala o grupo de conversación virtual identificado por un número numérico:

- **Talkgroups Estáticos (Fijos):** Están anclados de forma permanente en el repetidor. En Venezuela, el **TG 734 (Slot 1)** es estático en todos los repetidores oficiales: cualquier transmisión que ocurra en el país en ese grupo se irradiará por la antena del cerro sin que el operador local tenga que hacer nada.
- **Talkgroups Dinámicos (Bajo Demanda):** Se activan en el repetidor cuando pulsas el PTT en ese grupo durante 1 segundo. El servidor BrandMeister vincula ese canal al repetidor durante **10 a 15 minutos**. Si nadie transmite durante ese período, el enlace se desconecta automáticamente para liberar el ancho de banda del repetidor.

---

### ¿Cuándo y cómo debo hacer QSY (cambio de canal) desde el Talkgroup 734?

El **Talkgroup 734 (Nacional)** es el canal principal de encuentro, llamado y coordinación para toda Venezuela. Por tanto:

1. Si estableces contacto con un colega y tu conversación durará más de **2 a 3 minutos**, el protocolo de radioaficionado indica coordinar un cambio de canal (QSY).
2. Pasa a tu **Circuito Regional en Time Slot 2** (por ejemplo, TG 7345 en la región central) o a los canales tácticos **TG 7340** o **TG 73499**.
3. De esta manera, mantienes despejado el canal 734 para que estaciones de otros estados o colegas en móvil puedan ingresar a la red.

---

### ¿Cómo funciona el canal prioritario de emergencias (TG 734911 / YV5RNE)?

El **TG 734911 (Slot 1)** está reservado con carácter preferencial para la **Red Nacional de Emergencia del Radio Club Venezolano (YV5RNE)**, operativos de defensa civil, protección ante fenómenos meteorológicos o contingencias sísmicas.

- Se recomienda a todos los radioaficionados incluir el TG 734911 en su **Lista de Recepción (RX Group List)** del Slot 1 para estar atentos ante cualquier llamado de emergencia.
- Las estaciones deben mantener estricto silencio en este grupo a menos que estén canalizando tráfico formal de prevención o socorro.

---

### ¿Qué es el Color Code (CC) y por qué usamos Color Code 1 (CC1) en toda Venezuela?

El **Color Code (Código de Color)** es el equivalente digital al subtono CTCSS/DCS de la radio analógica:

- Actúa como filtro para que tu receptor solo abra el silenciador digital cuando la señal coincida con el código programado.
- En toda la infraestructura oficial de **BrandMeister Venezuela**, repetidores y puntos de acceso comunitarios utilizan unánimemente el **Color Code 1 (CC1)**.
- Esto simplifica la programación de los radios y codeplugs de los operadores nacionales, evitando errores de configuración entre distintas regiones del país.

---

### ¿Cuáles son los 9 Talkgroups de los Circuitos Regionales en Venezuela?

Para evitar saturar el canal nacional cuando se realizan ruedas locales o conversaciones provinciales, la red cuenta con 9 circuitos en **Time Slot 2**:

- **TG 7341:** Región 1 · Zulia y Falcón.
- **TG 7342:** Región 2 · Andes (Táchira, Mérida, Trujillo).
- **TG 7343:** Región 3 · Llanos Occidentales (Barinas, Portuguesa).
- **TG 7344:** Región 4 · Centro-Occidente (Lara, Yaracuy).
- **TG 7345:** Región 5 · Centro (Carabobo, Aragua, Miranda, Caracas, La Guaira).
- **TG 7346:** Región 6 · Llanos Centrales (Guárico, Cojedes, Apure).
- **TG 7347:** Región 7 · Oriente (Anzoátegui, Sucre, Monagas).
- **TG 7348:** Región 8 · Guayana y Sur (Bolívar, Amazonas, Delta Amacuro).
- **TG 7349:** Región 9 · Insular y Marítima (Nueva Esparta, Dependencias Federales).

---

## Repetidores y Cobertura Nacional

### ¿Cómo me conecto a los repetidores DMR de Caracas (YV5DMR en VHF y YV5VE en UHF)?

En el área metropolitana de Caracas y zonas aledañas operan dos repetidores principales con excelente cobertura:

1. **Repetidor YV5DMR (ID 734500) en VHF:**
   - **Frecuencia de Salida (TX Repetidor / RX Radio):** `147.240 MHz`
   - **Frecuencia de Entrada (RX Repetidor / TX Radio):** `147.840 MHz` (Offset +0.600 MHz)
   - **Color Code:** 1 | **Slots:** TS1 (Nacional/Mundo) y TS2 (Regional/Local)
   - **Emplazamiento:** Parque Nacional El Ávila (Waraira Repano). Cobertura sobre el valle de Caracas, Guarenas, Guatire y zonas de los Valles del Tuy.
2. **Repetidor YV5VE (ID 734014) en UHF:**
   - **Frecuencia de Salida (TX Repetidor / RX Radio):** `439.600 MHz`
   - **Frecuencia de Entrada (RX Repetidor / TX Radio):** `434.600 MHz` (Offset -5.000 MHz)
   - **Color Code:** 1 | **Slots:** TS1 y TS2
   - **Emplazamiento:** Caracas Metropolitana. Óptima penetración urbana entre estructuras y edificaciones.

---

### ¿Qué repetidores cubren Valencia, La Guaira, los Llanos y el Occidente de Venezuela?

La red cuenta con repetidores estratégicos en constante ampliación:

- **La Guaira / Litoral Central:** Repetidor **YV5CBO** (ID 734016) en VHF `147.150 MHz` (+0.600 MHz), Color Code 1.
- **Valencia / Carabobo:** Repetidor **YV4EGG** (ID 734013) en VHF `146.700 MHz` (-0.600 MHz), Color Code 1.
- **Llanos (Guárico y Cojedes):**
  - Altagracia de Orituco: **YV5VE** en `147.390 MHz` (+0.600 MHz), CC1.
  - Cerro Portachuelo: **YV5VE** en `146.820 MHz` (-0.600 MHz), CC1.
  - Cerro Platillón: **YV4KWT** en `147.090 MHz` (+0.600 MHz), CC1.
- **Zulia / Costa Oriental del Lago:** Repetidor **YV1GDQ** (ID 734015) en UHF `439.600 MHz` (-5.000 MHz), Color Code 1.

Puedes consultar el estado técnico y mapa actualizado en [brandmeisteryv.net/repetidores](https://brandmeisteryv.net/repetidores).

---

### ¿Qué son los puntos de acceso comunitarios de alta potencia (Araure y La Boyera)?

Son estaciones base comunitarias implementadas con radios de alta potencia (25 a 50 vatios) y antenas omnidireccionales elevadas que enlazan con BrandMeister vía IP:

- Operan en **frecuencia simplex VHF 146.550 MHz (CC1, Slot 2)**.
- **Punto de Acceso Araure (YV3ARO):** Cobertura extendida en las ciudades gemelas de Acarigua y Araure (Portuguesa).
- **Punto de Acceso La Boyera / El Hatillo (YV5FBP):** Cobertura en el sureste de Caracas (La Boyera, El Hatillo, Los Naranjos, Oripoto, La Trinidad).
- **Ventaja para el usuario:** Permite que cualquier colega con un radio portátil de mano (walkie-talkie) de 5W acceda a toda la red BrandMeister sin necesidad de comprar ni configurar un hotspot personal en su casa.

---

## Hotspots, Equipos y Configuración

### ¿Qué es un Hotspot MMDVM (Pi-Star / OpenGD77 / WPSD) y cuándo necesito uno?

Un **Hotspot MMDVM (Multi-Mode Digital Voice Modem)** es un micro-punto de acceso inalámbrico de baja potencia (generalmente entre 10 y 20 milivatios) que conecta tu radio portátil DMR con los servidores de BrandMeister a través del internet de tu casa o el punto de acceso WiFi de tu teléfono móvil.

**¿Cuándo es útil?:**
- Si vives fuera del radio de cobertura de los repetidores físicos de cerro.
- Si viajas al extranjero o te encuentras en un área rural sin repetidores cercanos.
- Si deseas explorar salas de conversación internacionales y talkgroups bajo demanda sin comprometer el tiempo de aire de un repetidor comunitario.

---

### ¿Cuáles son las frecuencias y el servidor máster recomendados para hotspots en Venezuela?

Al configurar tu software de hotspot (Pi-Star, WPSD o MMDVMHost):

1. **Servidor Máster Recomendado:** Selecciona **`BM Master Chile 7301`** (`7301.master.brandmeister.network`). Es el nodo troncal con menores saltos de enrutamiento y menor latencia de ping (RTT) hacia los proveedores de internet en Venezuela (CANTV, Fibra Óptica privada, Movistar, Digitel).
2. **Frecuencias Simplex Homologadas:**
   - **VHF:** `146.550 MHz` (Frecuencia Primaria Nacional Simplex).
   - **UHF:** `436.550 MHz` (Frecuencia Primaria UHF Simplex).
3. **Parámetros Digitales:** Color Code `1`, Time Slot `2` (los hotspots simplex operan exclusivamente en Time Slot 2).
4. **Contraseña de Seguridad:** Debes ingresar tu **Hotspot Security Password**, la cual defines previamente en el menú *SelfCare* de tu perfil de usuario en [brandmeister.network](https://brandmeister.network/).

---

### ¿Qué es un Codeplug y cómo genero el archivo para mi radio con la herramienta CSV?

Un **Codeplug** es el archivo binario o base de datos que se carga en la memoria del radio para programar todos los canales, frecuencias, repetidores, offsets, códigos de color y talkgroups.

En el portal oficial dispones de una herramienta automatizada:
1. Ingresa a [brandmeisteryv.net/generador-csv](https://brandmeisteryv.net/generador-csv).
2. Selecciona la marca y modelo de tu equipo (AnyTone, Radioddity, TyT, Baofeng, OpenGD77, Retevis).
3. La plataforma generará y descargará las listas de canales y contactos en formato `.csv` listas para importar en el software CPS oficial de tu equipo sin tener que escribir las frecuencias a mano.

---

### ¿Qué modelos de radio DMR son los más recomendados para operar en la red BrandMeister?

Cualquier radio compatible con el estándar **DMR Tier II (TDMA de 2 slots)** puede operar en la red. Entre los más utilizados y probados por la comunidad venezolana destacan:

- **AnyTone (AT-D878UVII Plus, AT-D868UV, AT-D578UV Móvil):** La referencia actual en radioafición DMR. Posee capacidad para más de 500.000 contactos en memoria, APRS digital y analógico, roaming y excelente calidad de audio.
- **Radios con firmware OpenGD77 (Baofeng DM-1701, Radioddity GD-77 / RD-5R, TyT MD-UV380 / MD-UV390):** Solución altamente popular y económica. El firmware comunitario de código abierto OpenGD77 transforma estos equipos en herramientas técnicas profesionales con analizador de espectro, calibración milimétrica de audio y fácil manejo.
- **Retevis (RT3S, RT73):** Equipos bibanda sólidos con amplia disponibilidad de codeplugs en la comunidad.
- **Equipos Comerciales Motorola MOTOTRBO (Series XPR, DGP, DP):** Estándar industrial de máxima robustez mecánica y pureza espectral.

---

### ¿Cómo puedo escuchar las conversaciones de BrandMeister Venezuela sin tener radio (Hoseline y Petra)?

Si aún no posees un radio digital DMR, puedes monitorear la actividad de la red de manera totalmente gratuita e inmediata desde cualquier computadora o teléfono:

1. **Audio en Vivo (Hoseline BrandMeister):**
   - En la barra de navegación superior de [brandmeisteryv.net](https://brandmeisteryv.net), haz clic en el botón de **Audio en Vivo (Hoseline)**.
   - Podrás escuchar en tiempo real el tráfico que transcurre en el **Talkgroup 734 Nacional**.
2. **Monitor y Telemetría en Vivo (Petra):**
   - Visita [brandmeisteryv.net/petra](https://brandmeisteryv.net/petra) o las salas por circuito como [brandmeisteryv.net/petra/734](https://brandmeisteryv.net/petra/734).
   - Observarás el registro en directo de quién está hablando, su indicativo, nombre, repetidor o hotspot utilizado, nivel de pérdida de paquetes y duración de cada cambio.
