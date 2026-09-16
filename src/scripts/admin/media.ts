// Panel · Optimización de medios en el navegador antes de subirlos
//  - Fotos: WebP que cabe en 1500×1500 sin recortar (vertical 4:5 → 1200×1500, 9:16 → 844×1500)
//  - Videos: recodificados a máx. 1080p ~2,5 Mbps con los codificadores del navegador (MediaRecorder)
//  - Subida por partes para no chocar con upload_max_filesize del hosting

export const MAX_IMAGE_SIDE = 1500;
// Imagen destacada de una noticia: más grande pero exprimida al máximo
export const POST_IMAGE_MAX = { width: 1920, height: 1280 };
const WEBP_QUALITY = 0.82;
const WEBP_QUALITY_ULTRA = 0.68;
const VIDEO_MAX_LONG_SIDE = 1920;
const VIDEO_MAX_SHORT_SIDE = 1080;
const VIDEO_BITRATE = 2_500_000;
const AUDIO_BITRATE = 128_000;
export const VIDEO_MAX_SECONDS = 5 * 60;
const CHUNK_BYTES = 4 * 1024 * 1024;

export type ProcessedImage = { blob: Blob; width: number; height: number; originalBytes: number };
export type ProcessedVideo = {
  blob: Blob;
  poster: ProcessedImage;
  width: number;
  height: number;
  duration: number;
  originalBytes: number;
  compressed: boolean;
};

/** Tamaño final que cabe en un cuadro de maxWidth × maxHeight sin agrandar ni recortar */
export function fitWithin(width: number, height: number, maxWidth = MAX_IMAGE_SIDE, maxHeight = maxWidth) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export type ImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** 'ultra' usa el codificador WebAssembly (más lento, archivos bastante menores) */
  mode?: 'rapido' | 'ultra';
};

// ---------------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------------

async function decodeImage(file: Blob): Promise<ImageBitmap> {
  try {
    // Respeta la orientación EXIF de las fotos de móvil
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Reduce en pasos de la mitad para evitar el aliasing de un único redimensionado grande */
function drawScaled(source: CanvasImageSource, srcW: number, srcH: number, dstW: number, dstH: number): HTMLCanvasElement {
  let canvas = document.createElement('canvas');
  let w = srcW;
  let h = srcH;
  canvas.width = w;
  canvas.height = h;
  let ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, w, h);

  while (w / 2 >= dstW && h / 2 >= dstH) {
    const next = document.createElement('canvas');
    next.width = Math.round(w / 2);
    next.height = Math.round(h / 2);
    const nctx = next.getContext('2d')!;
    nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(canvas, 0, 0, next.width, next.height);
    canvas = next;
    w = next.width;
    h = next.height;
  }

  if (w !== dstW || h !== dstH) {
    const final = document.createElement('canvas');
    final.width = dstW;
    final.height = dstH;
    ctx = final.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, dstW, dstH);
    canvas = final;
  }
  return canvas;
}

/** Codificador WebAssembly: compresión máxima (método 6) y también el respaldo de Safari */
async function encodeWithWasm(canvas: HTMLCanvasElement, quality: number, ultra: boolean): Promise<Blob> {
  const { default: encode } = await import('@jsquash/webp/encode');
  const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
  const buffer = await encode(data, ultra
    ? { quality: Math.round(quality * 100), method: 6, sns_strength: 80, filter_strength: 40, use_sharp_yuv: 1 }
    : { quality: Math.round(quality * 100) });
  return new Blob([buffer], { type: 'image/webp' });
}

async function canvasToWebp(canvas: HTMLCanvasElement, quality = WEBP_QUALITY, mode: 'rapido' | 'ultra' = 'rapido'): Promise<Blob> {
  if (mode === 'ultra') {
    // Se prueban las dos vías y se sube la más liviana
    const wasm = await encodeWithWasm(canvas, quality, true).catch(() => null);
    const native = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    const valido = native && native.type === 'image/webp' ? native : null;
    if (wasm && valido) return wasm.size <= valido.size ? wasm : valido;
    if (wasm || valido) return (wasm ?? valido)!;
    throw new Error('No se pudo convertir la imagen a WebP.');
  }

  const native = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (native && native.type === 'image/webp') {
    return native;
  }
  // Safari no codifica WebP en canvas: codificador WebAssembly (se descarga solo si hace falta)
  return encodeWithWasm(canvas, quality, false);
}

export async function processImage(file: Blob, options: ImageOptions = {}): Promise<ProcessedImage> {
  const {
    maxWidth = MAX_IMAGE_SIDE,
    maxHeight = maxWidth,
    mode = 'rapido',
    quality = mode === 'ultra' ? WEBP_QUALITY_ULTRA : WEBP_QUALITY,
  } = options;
  const bitmap = await decodeImage(file);
  try {
    const target = fitWithin(bitmap.width, bitmap.height, maxWidth, maxHeight);
    const canvas = drawScaled(bitmap, bitmap.width, bitmap.height, target.width, target.height);
    const blob = await canvasToWebp(canvas, quality, mode);
    return { blob, width: target.width, height: target.height, originalBytes: file.size };
  } finally {
    bitmap.close();
  }
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

function pickRecorderType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  // MP4 primero (se reproduce en todos los navegadores); WebM si el navegador no graba MP4 (Firefox)
  const candidates = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1.42E01F,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export function canCompressVideo() {
  const canvas = document.createElement('canvas') as HTMLCanvasElement & { captureStream?: unknown };
  return pickRecorderType() !== null && typeof canvas.captureStream === 'function';
}

function loadVideo(file: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error('El navegador no puede leer este video. Prueba con MP4 (H.264).'));
  });
}

function seek(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
    video.currentTime = time;
  });
}

async function capturePoster(video: HTMLVideoElement, originalBytes: number): Promise<ProcessedImage> {
  await seek(video, Math.min(1, video.duration / 10));
  const target = fitWithin(video.videoWidth, video.videoHeight);
  const canvas = drawScaled(video, video.videoWidth, video.videoHeight, target.width, target.height);
  const blob = await canvasToWebp(canvas);
  await seek(video, 0);
  return { blob, width: target.width, height: target.height, originalBytes };
}

/**
 * Comprime un video reproduciéndolo en un canvas y grabándolo con MediaRecorder.
 * Tarda aproximadamente lo que dura el video (el audio se graba en tiempo real).
 * Si el navegador no puede comprimir, o el resultado pesa más que el original MP4, se usa el original.
 */
export async function processVideo(file: File, onProgress: (ratio: number) => void, signal?: AbortSignal): Promise<ProcessedVideo> {
  const video = await loadVideo(file);
  try {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error('No se pudo leer la duración del video.');
    }
    if (video.duration > VIDEO_MAX_SECONDS) {
      throw new Error(`El video dura más de ${VIDEO_MAX_SECONDS / 60} minutos. Recórtalo antes de subirlo.`);
    }

    const poster = await capturePoster(video, file.size);
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const scale = Math.min(1, VIDEO_MAX_LONG_SIDE / Math.max(srcW, srcH), VIDEO_MAX_SHORT_SIDE / Math.min(srcW, srcH));
    // Los codificadores H.264 exigen dimensiones pares
    const width = Math.max(2, Math.round((srcW * scale) / 2) * 2);
    const height = Math.max(2, Math.round((srcH * scale) / 2) * 2);
    const originalIsMp4 = /^video\/mp4$/i.test(file.type) || /\.mp4$/i.test(file.name);

    const mimeType = pickRecorderType();
    if (!mimeType || !canCompressVideo()) {
      if (!originalIsMp4) throw new Error('Este navegador no puede comprimir videos. Usa Chrome, Edge o Safari recientes, o sube un MP4.');
      onProgress(1);
      return { blob: file, poster, width: srcW, height: srcH, duration: video.duration, originalBytes: file.size, compressed: false };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    const stream = (canvas as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }).captureStream(30);

    // Audio por Web Audio: se graba sin sonar por los altavoces
    let audioContext: AudioContext | null = null;
    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch {
      // Video sin pista de audio o navegador sin Web Audio: se graba solo la imagen
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITRATE, audioBitsPerSecond: AUDIO_BITRATE });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

    const draw = () => {
      ctx.drawImage(video, 0, 0, width, height);
      onProgress(Math.min(0.99, video.currentTime / video.duration));
    };
    let frameHandle = 0;
    const loop = () => {
      draw();
      if (!video.paused && !video.ended) {
        frameHandle = 'requestVideoFrameCallback' in video
          ? (video as HTMLVideoElement & { requestVideoFrameCallback(cb: () => void): number }).requestVideoFrameCallback(loop)
          : requestAnimationFrame(loop);
      }
    };

    const abort = () => {
      video.pause();
      if (recorder.state !== 'inactive') recorder.stop();
    };
    signal?.addEventListener('abort', abort, { once: true });

    draw();
    recorder.start(1000);
    await audioContext?.resume();
    await video.play();
    loop();
    await new Promise<void>((resolve) => (video.onended = () => resolve()));
    cancelAnimationFrame(frameHandle);
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    await audioContext?.close();
    signal?.removeEventListener('abort', abort);

    if (signal?.aborted) {
      throw new DOMException('Cancelado', 'AbortError');
    }

    const type = mimeType.split(';')[0];
    const blob = new Blob(chunks, { type });
    onProgress(1);

    if (originalIsMp4 && blob.size >= file.size) {
      // Ya venía optimizado: no tiene sentido subir algo más pesado
      return { blob: file, poster, width: srcW, height: srcH, duration: video.duration, originalBytes: file.size, compressed: false };
    }
    return { blob, poster, width, height, duration: video.duration, originalBytes: file.size, compressed: true };
  } finally {
    URL.revokeObjectURL(video.src);
  }
}

// ---------------------------------------------------------------------------
// Subida por partes
// ---------------------------------------------------------------------------

function newUploadId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Sube un Blob en partes de 4 MB y devuelve el upload_id que usa gallery.php?action=save */
export async function uploadInChunks(
  blob: Blob,
  kind: 'image' | 'poster' | 'video' | 'post-image',
  onProgress?: (ratio: number) => void,
  endpoint = '/api/gallery.php?action=upload_chunk'
): Promise<string> {
  const uploadId = newUploadId();
  const total = Math.max(1, Math.ceil(blob.size / CHUNK_BYTES));

  for (let index = 0; index < total; index++) {
    const part = blob.slice(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES);
    const form = new FormData();
    form.append('upload_id', uploadId);
    form.append('index', String(index));
    form.append('total', String(total));
    form.append('kind', kind);
    form.append('chunk', part, `${kind}.part`);

    let lastError = '';
    // Reintenta cada parte hasta 3 veces ante fallos de red
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(endpoint, { method: 'POST', body: form, credentials: 'same-origin' });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          document.dispatchEvent(new CustomEvent('bm:unauthorized'));
          throw new Error('Tu sesión expiró.');
        }
        if (!res.ok || data.success === false) {
          // Errores de validación: no tiene sentido reintentar
          throw Object.assign(new Error(data.error || `Error ${res.status} al subir.`), { fatal: res.status < 500 });
        }
        lastError = '';
        break;
      } catch (err) {
        lastError = (err as Error).message;
        if ((err as { fatal?: boolean }).fatal) break;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    if (lastError) throw new Error(lastError);
    onProgress?.((index + 1) / total);
  }
  return uploadId;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
