<?php
/**
 * Verificación de Google reCAPTCHA v3 (puntuación 0.0 - 1.0 y acción esperada).
 *
 * Configuración (~/bmyv-config.php o variables de entorno):
 *   RECAPTCHA_SECRET_KEY  clave secreta v3
 *   RECAPTCHA_MIN_SCORE   puntuación mínima aceptada (por defecto 0.5)
 */

require_once __DIR__ . '/env.php';

if (!function_exists('bm_recaptcha_configured')) {
    function bm_recaptcha_configured() {
        return trim((string)getenv('RECAPTCHA_SECRET_KEY')) !== '';
    }
}

if (!function_exists('bm_verify_recaptcha')) {
    /**
     * @return array{ok: bool, skipped?: bool, score?: float, reason?: string}
     */
    function bm_verify_recaptcha($token, $expectedAction) {
        $secret = trim((string)getenv('RECAPTCHA_SECRET_KEY'));
        if ($secret === '') {
            // Sin clave se rechaza, salvo en localhost o si se desactiva explícitamente con RECAPTCHA_DISABLED=1
            $isLocalhost = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', '::1'], true);
            if ($isLocalhost || getenv('RECAPTCHA_DISABLED') === '1') {
                error_log('[BM-YV] reCAPTCHA sin configurar: se omite la verificación');
                return ['ok' => true, 'skipped' => true];
            }
            error_log('[BM-YV] reCAPTCHA sin configurar (RECAPTCHA_SECRET_KEY vacío): envío rechazado');
            return ['ok' => false, 'reason' => 'not-configured'];
        }

        $token = trim((string)$token);
        if ($token === '' || strlen($token) > 4096) {
            return ['ok' => false, 'reason' => 'missing-token'];
        }

        $postData = http_build_query([
            'secret' => $secret,
            'response' => $token,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
        ]);
        $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

        $response = false;
        if (function_exists('curl_init')) {
            $ch = curl_init($verifyUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $postData,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 8,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);
            $response = curl_exec($ch);
            curl_close($ch);
        }
        if ($response === false) {
            $context = stream_context_create(['http' => [
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => $postData,
                'timeout' => 8,
            ]]);
            $response = @file_get_contents($verifyUrl, false, $context);
        }

        $result = json_decode((string)$response, true);
        if (!is_array($result)) {
            return ['ok' => false, 'reason' => 'verify-unreachable'];
        }
        if (empty($result['success'])) {
            $codes = isset($result['error-codes']) ? implode(',', (array)$result['error-codes']) : 'unknown';
            return ['ok' => false, 'reason' => 'google:' . $codes];
        }

        $score = isset($result['score']) ? (float)$result['score'] : 0.0;
        $minScore = getenv('RECAPTCHA_MIN_SCORE');
        $minScore = ($minScore === false || $minScore === '') ? 0.5 : (float)$minScore;

        if (($result['action'] ?? '') !== $expectedAction) {
            return ['ok' => false, 'score' => $score, 'reason' => 'action-mismatch'];
        }
        if ($score < $minScore) {
            return ['ok' => false, 'score' => $score, 'reason' => 'low-score'];
        }
        return ['ok' => true, 'score' => $score];
    }
}
