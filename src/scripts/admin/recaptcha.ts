// Panel · reCAPTCHA v3 invisible para el inicio de sesión y "¿Olvidaste tu contraseña?"
// La clave de sitio llega en data-recaptcha-site-key (PUBLIC_RECAPTCHA_SITE_KEY al compilar).
// Sin clave (desarrollo local) no se carga nada y el servidor omite la verificación.

type Grecaptcha = {
  ready(cb: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let loader: Promise<Grecaptcha> | null = null;

function siteKey(): string {
  return document.getElementById('wp-login-screen')?.dataset.recaptchaSiteKey?.trim() || '';
}

/** Descarga el script de Google una sola vez (v3 necesita unos segundos de señales antes de pedir el token) */
export function preloadRecaptcha(): Promise<Grecaptcha | null> {
  const key = siteKey();
  if (!key) return Promise.resolve(null);
  if (loader) return loader;
  loader = new Promise<Grecaptcha>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}&hl=es-419`;
    script.async = true;
    script.onload = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));
    script.onerror = () => {
      loader = null;
      reject(new Error('No se pudo cargar reCAPTCHA. Revisa tu conexión o desactiva el bloqueador para este sitio.'));
    };
    document.head.appendChild(script);
  });
  return loader;
}

/** Token recién generado para la acción ('' si el sitio no usa reCAPTCHA) */
export async function recaptchaToken(action: 'login' | 'forgot'): Promise<string> {
  const key = siteKey();
  if (!key) return '';
  const token = preloadRecaptcha().then((g) => g!.execute(key, { action }));
  // Con un bloqueador o sin conexión, Google puede no responder nunca
  const timeout = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('reCAPTCHA no respondió. Recarga la página e inténtalo de nuevo.')), 10000)
  );
  return Promise.race([token, timeout]);
}
