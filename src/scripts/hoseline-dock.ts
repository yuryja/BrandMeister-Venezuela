import { hoseline } from "./hoseline";

// ── Desbloqueo de audio en móviles ────────────────────────────────────────
let silentLoop: HTMLAudioElement | null = null;

function silentWavUrl(): string {
  const samples = 800; // 0,1 s a 8 kHz, 8 bits, silencio (valor 128)
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + samples, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, "data"); v.setUint32(40, samples, true);
  new Uint8Array(buf, 44).fill(128);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

export function unlockAudio() {
  const w = window as any;
  try {
    if (w.navigator?.audioSession) w.navigator.audioSession.type = "playback";

    const AudioCtxClass = window.AudioContext || w.webkitAudioContext;
    if (!AudioCtxClass) return;
    if (!w.__bmAudioCtx) w.__bmAudioCtx = new AudioCtxClass();
    const ctx: AudioContext = w.__bmAudioCtx;
    if (ctx.state !== "running") ctx.resume().catch(() => {});

    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start(0);

    if (!w.navigator?.audioSession) {
      silentLoop ??= Object.assign(new Audio(silentWavUrl()), { loop: true });
      silentLoop.setAttribute("playsinline", "");
      silentLoop.play().catch(() => {});
    }
  } catch (err) {
    console.warn("[Hoseline] No se pudo desbloquear el audio:", err);
  }
}

function releaseSilentLoop() {
  silentLoop?.pause();
}

const dock = document.getElementById("hoseline-dock");
const statusLabel = document.getElementById("dock-status-label");
const callsignEl = document.getElementById("dock-callsign");
const aliasEl = document.getElementById("dock-alias");
const wave = document.getElementById("dock-wave");
const volSlider = document.getElementById("dock-volume") as HTMLInputElement;
const stopBtn = document.getElementById("dock-stop-btn");

let pendingVolume: number | null = null;

volSlider?.addEventListener("input", (e) => {
  const val = Number((e.target as HTMLInputElement).value) / 100;
  if (hoseline) hoseline.setVolume(val);
  else pendingVolume = val;
});

stopBtn?.addEventListener("click", () => {
  if (isAudioActive) {
    isAudioActive = false;
    sendAudioStop();
  }
  hoseline.disconnect();
});

const operatorCache = new Map<string, string>();

function formatOperatorText(call: any): string {
  if (!call) return "Escuchando...";
  const callsign = (call.callsign || "").trim().toUpperCase();
  let name = (call.name || "").trim();
  const alias = (call.alias || "").trim();

  if (!name && callsign && operatorCache.has(callsign)) {
    name = operatorCache.get(callsign)!;
  }

  if (!name && alias) {
    let cleanAlias = alias;
    if (callsign && cleanAlias.toUpperCase().startsWith(callsign)) {
      cleanAlias = cleanAlias.slice(callsign.length).replace(/^[\s\-_/:]+/, "").trim();
    }
    if (cleanAlias && cleanAlias.toUpperCase() !== callsign) {
      name = cleanAlias;
    }
  }

  if (!name && (call.sourceId || callsign)) {
    const queryId = call.sourceId || callsign;
    fetch(`https://database.radioid.net/api/dmr/user/?id=${queryId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const resObj = data?.results?.[0];
        const resolvedName = resObj?.fname || resObj?.name || "";
        if (resolvedName && callsign) {
          operatorCache.set(callsign, resolvedName);
          const active = hoseline.getActiveCall();
          if (active && active.callsign?.toUpperCase() === callsign) {
            active.name = resolvedName;
            if (aliasEl) aliasEl.textContent = `${callsign} - ${resolvedName}`;
          }
        }
      })
      .catch(() => {});
  }

  if (callsign && name) return `${callsign} - ${name}`;
  if (callsign) return callsign;
  if (name) return name;
  return "Escuchando...";
}

window.addEventListener("hoseline:stateChange", (e: any) => {
  const state = e.detail?.state;
  updateAllButtons(state);

  if (state === "idle" || state === "error") {
    releaseSilentLoop();
    dock?.classList.remove("is-visible");
    wave?.classList.add("is-idle");
    if (statusLabel) statusLabel.textContent = "DMR EN LÍNEA";
    if (callsignEl) callsignEl.textContent = "TG 734 - Venezuela";
    if (aliasEl) aliasEl.textContent = "Escuchando...";
  } else {
    dock?.classList.add("is-visible");
    if (statusLabel) statusLabel.textContent = "DMR EN LÍNEA";
    if (callsignEl) callsignEl.textContent = "TG 734 - Venezuela";

    if (state === "connecting" || state === "listening") {
      if (aliasEl) aliasEl.textContent = state === "connecting" ? "Conectando con BrandMeister…" : "Escuchando...";
      wave?.classList.add("is-idle");
    } else if (state === "transmitting") {
      const call = hoseline.getActiveCall();
      if (aliasEl) aliasEl.textContent = formatOperatorText(call);
      wave?.classList.remove("is-idle");
    }
  }
});

window.addEventListener("hoseline:callStart", (e: any) => {
  const call = e.detail;
  if (statusLabel) statusLabel.textContent = "DMR EN LÍNEA";
  if (callsignEl) callsignEl.textContent = "TG 734 - Venezuela";
  if (aliasEl) aliasEl.textContent = formatOperatorText(call);
  wave?.classList.remove("is-idle");
});

window.addEventListener("hoseline:callAlias", (e: any) => {
  const call = hoseline.getActiveCall();
  if (call && aliasEl) {
    if (e.detail?.alias) call.alias = e.detail.alias;
    aliasEl.textContent = formatOperatorText(call);
  }
});

window.addEventListener("hoseline:callEnd", () => {
  if (statusLabel) statusLabel.textContent = "DMR EN LÍNEA";
  if (callsignEl) callsignEl.textContent = "TG 734 - Venezuela";
  if (aliasEl) aliasEl.textContent = "Escuchando...";
  wave?.classList.add("is-idle");
});

let isAudioActive = false;
let audioHeartbeatTimer: any = null;

function sendAudioStop() {
  stopAudioHeartbeat();
  const payload = JSON.stringify({
    event_type: "player_play",
    event_category: "audio_stop",
    entity_id: "tg-734",
    entity_title: "TG 734 Hoseline Audio"
  });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics.php?action=track", blob);
    } else {
      fetch("/api/analytics.php?action=track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch (_) {}
}

function startAudioHeartbeat() {
  if (audioHeartbeatTimer) return;
  audioHeartbeatTimer = setInterval(() => {
    if (hoseline && hoseline.getState() !== "idle" && hoseline.getState() !== "error") {
      fetch("/api/analytics.php?action=track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "player_play",
          event_category: "audio_heartbeat",
          entity_id: "tg-734",
          entity_title: "TG 734 Hoseline Audio"
        }),
        keepalive: true
      }).catch(() => {});
    } else {
      if (isAudioActive) {
        isAudioActive = false;
        sendAudioStop();
      } else {
        stopAudioHeartbeat();
      }
    }
  }, 25000);
}

function stopAudioHeartbeat() {
  if (audioHeartbeatTimer) {
    clearInterval(audioHeartbeatTimer);
    audioHeartbeatTimer = null;
  }
}

window.addEventListener("beforeunload", () => {
  if (isAudioActive) {
    isAudioActive = false;
    sendAudioStop();
  }
  hoseline.disconnect();
});
window.addEventListener("pagehide", () => {
  if (isAudioActive) {
    isAudioActive = false;
    sendAudioStop();
  }
  hoseline.disconnect();
});

function updateAllButtons(state: string) {
  const isActive = state !== "idle" && state !== "error";
  if (isActive) {
    isAudioActive = true;
    startAudioHeartbeat();
  } else {
    if (isAudioActive) {
      isAudioActive = false;
      sendAudioStop();
    } else {
      stopAudioHeartbeat();
    }
  }

  const headerBtn = document.querySelectorAll(".btn-hoseline-native");
  headerBtn.forEach((btn) => {
    const textSpan = btn.querySelector(".btn-label");
    if (!isActive) {
      btn.classList.remove("is-active", "is-transmitting");
      if (textSpan) textSpan.textContent = "Audio en Vivo";
    } else {
      btn.classList.add("is-active");
      if (state === "transmitting") {
        btn.classList.add("is-transmitting");
      } else {
        btn.classList.remove("is-transmitting");
      }
      if (textSpan) textSpan.textContent = "Escuchando TG 734";
    }
  });

  const heroBtn = document.querySelectorAll(".btn-hero-primary-hoseline");
  heroBtn.forEach((btn) => {
    btn.classList.toggle("is-active", isActive);
  });
}

export function toggleHoseline(tg: number = 734) {
  const willStart = !hoseline || hoseline.getState() === "idle" || hoseline.getState() === "error";
  if (willStart) {
    unlockAudio();
    isAudioActive = true;
    try {
      fetch("/api/analytics.php?action=track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "player_play",
          event_category: "audio",
          entity_id: `tg-${tg}`,
          entity_title: `TG ${tg} Hoseline Audio`
        }),
        keepalive: true
      }).catch(() => {});
    } catch (_) {}
  } else {
    if (isAudioActive) {
      isAudioActive = false;
      sendAudioStop();
    }
  }
  if (pendingVolume !== null) hoseline.setVolume(pendingVolume);
  hoseline.toggle(tg);
}

// Global click delegation for all .js-toggle-hoseline buttons once loaded
document.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest(".js-toggle-hoseline");
  if (target) {
    e.preventDefault();
    toggleHoseline(734);
  }
});
