import { encode, decode } from "@msgpack/msgpack";

export const DEFAULT_TOKEN = "test:test";
export const WSS_BASE = "wss://hose.brandmeister.network/spotter/";
export const WSS_URL = `${WSS_BASE}?token=${DEFAULT_TOKEN}`;
export const PROTOCOL = "spotter";
export const DEFAULT_TG = 734;

export const TYPE_GROUP_JOIN = 1;
export const TYPE_GROUP_LEAVE = 2;
export const TYPE_GROUP_RESET = 3;
export const TYPE_CALL_START = 11;
export const TYPE_CALL_DROP = 12;
export const TYPE_CALL_END = 13;
export const TYPE_CALL_AUDIO = 20;
export const TYPE_CALL_ALIAS = 21;
export const TYPE_CALL_METER = 22;

// G.711 mu-law decompression lookup constants
const Cy = [0, 132, 396, 924, 1980, 4092, 8316, 16764];

function decodeMuLawSample(byte: number): number {
  const inverted = ~byte & 0xff;
  const sign = 128 & inverted;
  const exponent = (inverted >> 4) & 7;
  const mantissa = 15 & inverted;
  let magnitude = Cy[exponent] + (mantissa << (exponent + 3));
  if (sign !== 0) magnitude = -magnitude;
  return magnitude / 32768; // Normalized -1.0 to 1.0
}

export type PlayerState = "idle" | "connecting" | "listening" | "transmitting" | "error";

export interface ActiveCall {
  sourceId?: number;
  callsign?: string;
  talkgroup?: number;
  alias?: string;
  startTime?: number;
}

class HoselineService {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime = 0;
  private currentTg = DEFAULT_TG;
  private state: PlayerState = "idle";
  private activeCall: ActiveCall | null = null;
  private volume = 0.9;
  private reconnectTimer: any = null;
  private manualStop = false;

  constructor() {
    // Expose on window for direct access
    if (typeof window !== "undefined") {
      (window as any).HoselinePlayer = this;
    }
  }

  public getState(): PlayerState {
    return this.state;
  }

  public getActiveCall(): ActiveCall | null {
    return this.activeCall;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    this.dispatch("volume", { volume: this.volume });
  }

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public async connect(tg: number = DEFAULT_TG) {
    this.manualStop = false;
    this.currentTg = tg;
    this.setState("connecting");
    this.initAudio();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    try {
      this.ws = new WebSocket(WSS_URL, PROTOCOL);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        // Subscribe to TG 734
        const joinPacket = encode([TYPE_GROUP_JOIN, [this.currentTg]]);
        this.ws?.send(joinPacket);
        this.setState("listening");
        this.dispatch("connected", { talkgroup: this.currentTg });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const raw = new Uint8Array(event.data);
          const data = decode(raw) as any[];
          this.handlePacket(data);
        } catch (err) {
          console.warn("[Hoseline] Packet decode error:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[Hoseline] Socket error:", err);
        this.setState("error");
        this.dispatch("error", { error: err });
      };

      this.ws.onclose = (event) => {
        this.ws = null;
        if (!this.manualStop) {
          // Reconnect attempt after 3s
          this.setState("connecting");
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (!this.manualStop) this.connect(this.currentTg);
          }, 3000);
        } else {
          this.setState("idle");
          this.dispatch("disconnected", {});
        }
      };
    } catch (err) {
      this.setState("error");
      this.dispatch("error", { error: err });
    }
  }

  public disconnect() {
    this.manualStop = true;
    clearTimeout(this.reconnectTimer);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const leavePacket = encode([TYPE_GROUP_LEAVE, [this.currentTg]]);
        this.ws.send(leavePacket);
        this.ws.close();
      } catch (e) {}
    }
    this.ws = null;

    if (this.audioCtx && this.audioCtx.state === "running") {
      try {
        this.audioCtx.suspend();
      } catch (e) {}
    }

    this.activeCall = null;
    this.setState("idle");
    this.dispatch("disconnected", {});
  }

  public toggle(tg: number = DEFAULT_TG) {
    if (this.state === "idle" || this.state === "error") {
      this.connect(tg);
    } else {
      this.disconnect();
    }
  }

  private handlePacket(data: any[]) {
    if (!Array.isArray(data) || data.length === 0) return;

    const type = data[0];

    switch (type) {
      case TYPE_CALL_START: {
        // data[1] usually contains call metadata
        const callInfo = data[1] || {};
        this.activeCall = {
          sourceId: callInfo.SourceID || callInfo.source || 0,
          callsign: callInfo.Callsign || callInfo.callsign || `ID:${callInfo.SourceID || ""}`,
          talkgroup: callInfo.DestinationID || this.currentTg,
          alias: callInfo.TalkerAlias || callInfo.alias || "",
          startTime: Date.now()
        };
        this.setState("transmitting");
        this.dispatch("callStart", this.activeCall);
        break;
      }

      case TYPE_CALL_AUDIO: {
        const audioData = data[1];
        if (audioData) {
          this.playAudioBuffer(audioData);
          if (this.state !== "transmitting") {
            this.setState("transmitting");
          }
          this.dispatch("audio", { length: audioData.length });
        }
        break;
      }

      case TYPE_CALL_ALIAS: {
        if (this.activeCall && data[1]) {
          this.activeCall.alias = String(data[1]);
          this.dispatch("callAlias", { alias: this.activeCall.alias });
        }
        break;
      }

      case TYPE_CALL_END:
      case TYPE_CALL_DROP: {
        this.activeCall = null;
        this.setState("listening");
        this.dispatch("callEnd", {});
        break;
      }
    }
  }

  private playAudioBuffer(muLawData: Uint8Array | number[]) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const numSamples = muLawData.length;
    if (numSamples === 0) return;

    const pcm8k = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      pcm8k[i] = decodeMuLawSample(muLawData[i]);
    }

    // DMR audio is 8000 Hz mono
    const buffer = this.audioCtx.createBuffer(1, numSamples, 8000);
    buffer.copyToChannel(pcm8k, 0);

    const sourceNode = this.audioCtx.createBufferSource();
    sourceNode.buffer = buffer;

    if (this.gainNode) {
      sourceNode.connect(this.gainNode);
    } else {
      sourceNode.connect(this.audioCtx.destination);
    }

    const now = this.audioCtx.currentTime;
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.025; // 25ms jitter buffer
    }

    sourceNode.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  private setState(newState: PlayerState) {
    this.state = newState;
    this.dispatch("stateChange", { state: newState });
  }

  private dispatch(eventName: string, detail: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(`hoseline:${eventName}`, { detail }));
    }
  }
}

// Instantiate singleton
export const hoseline = new HoselineService();
