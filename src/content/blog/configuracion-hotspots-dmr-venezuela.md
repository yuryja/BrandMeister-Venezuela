---
title: "Guía esencial: Configuración de Hotspots DMR en BrandMeister Venezuela"
description: "Paso a paso para configurar tu hotspot MMDVM (Pi-Star / WPSD) conectado a los servidores máster 3341 y 7301 con los parámetros oficiales recomendados."
pubDate: 2026-08-05
author: "Equipo Técnico"
authorCallsign: "YV5VE / YV5OF"
tags: ["Hotspots", "Pi-Star", "MMDVM", "Configuración"]
category: "Guías Técnicas"
readTime: "6 min de lectura"
featured: false
---

Los puntos de acceso personales (**Hotspots**) basados en placas MMDVM y sistemas como **Pi-Star** o **WPSD** han democratizado el acceso a la voz digital en Venezuela. Para asegurar que tu nodo opere con la máxima estabilidad y sin generar colisiones con la red nacional, te presentamos los parámetros de configuración oficial.

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

Recuerda mantener una separación adecuada de antena respecto a tus transceptores base y verificar en el dashboard de Pi-Star que tu BER (Bit Error Rate) sea inferior al 0.5%.
