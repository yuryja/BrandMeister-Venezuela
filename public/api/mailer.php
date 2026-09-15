<?php
/**
 * Envío de correo por SMTP autenticado (cuenta de correo de cPanel) sin dependencias.
 *
 * Configuración (~/bmyv-config.php o variables de entorno):
 *   SMTP_HOST     p. ej. mail.brandmeisteryv.net (vacío = usar mail() de PHP)
 *   SMTP_PORT     465 (SSL) o 587 (STARTTLS)
 *   SMTP_SECURE   ssl | tls | none
 *   SMTP_USER     noreply@brandmeisteryv.net
 *   SMTP_PASS     contraseña de esa cuenta
 *   MAIL_FROM     remitente (por defecto SMTP_USER)
 *   MAIL_FROM_NAME nombre del remitente
 */

require_once __DIR__ . '/env.php';

if (!function_exists('bm_send_mail')) {

    /**
     * Envía un correo HTML + texto plano.
     *
     * @param string|array $to        correo o lista de correos
     * @param array        $options   reply_to, reply_to_name
     * @return array{ok: bool, error?: string}
     */
    function bm_send_mail($to, $subject, $html, $text, array $options = []) {
        $recipients = array_values(array_filter((array)$to, function ($addr) {
            return is_string($addr) && filter_var($addr, FILTER_VALIDATE_EMAIL);
        }));
        if (empty($recipients)) {
            return ['ok' => false, 'error' => 'Destinatario no válido'];
        }

        $host = trim((string)getenv('SMTP_HOST'));
        $user = trim((string)getenv('SMTP_USER'));
        $from = trim((string)getenv('MAIL_FROM')) ?: ($user ?: 'no-reply@brandmeisteryv.net');
        $fromName = trim((string)getenv('MAIL_FROM_NAME')) ?: 'BrandMeister Venezuela';

        $replyTo = $options['reply_to'] ?? '';
        $replyTo = filter_var($replyTo, FILTER_VALIDATE_EMAIL) ? $replyTo : '';
        $replyToName = bm_mail_header_text($options['reply_to_name'] ?? '');

        $boundary = 'bmyv_' . bin2hex(random_bytes(12));
        $domain = substr(strrchr($from, '@') ?: '@brandmeisteryv.net', 1);

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . bm_mail_encode_header($fromName) . " <$from>",
            'Message-ID: <' . bin2hex(random_bytes(16)) . "@$domain>",
            'Subject: ' . bm_mail_encode_header(bm_mail_header_text($subject)),
            'MIME-Version: 1.0',
            "Content-Type: multipart/alternative; boundary=\"$boundary\"",
            'X-Mailer: BrandMeister-YV-Portal/2.0',
        ];
        if ($replyTo !== '') {
            $headers[] = 'Reply-To: ' . ($replyToName !== '' ? bm_mail_encode_header($replyToName) . ' ' : '') . "<$replyTo>";
        }

        $body = "--$boundary\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($text))
            . "--$boundary\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($html))
            . "--$boundary--\r\n";

        // Sin SMTP configurado: mail() de PHP (entrega poco fiable en hosting compartido)
        if ($host === '') {
            $toHeader = implode(', ', $recipients);
            $mailHeaders = array_filter($headers, function ($h) {
                return stripos($h, 'Subject:') !== 0 && stripos($h, 'Date:') !== 0;
            });
            $ok = @mail($toHeader, bm_mail_encode_header(bm_mail_header_text($subject)), $body, implode("\r\n", $mailHeaders), '-f' . $from);
            if (!$ok) {
                error_log('[BM-YV] mail() falló enviando a ' . $toHeader);
            }
            return $ok ? ['ok' => true] : ['ok' => false, 'error' => 'No fue posible enviar el correo (mail)'];
        }

        // El destinatario no va en la cabecera To si son varios: cada uno recibe sin ver a los demás
        $toHeaderValue = count($recipients) === 1 ? $recipients[0] : 'undisclosed-recipients:;';
        $message = implode("\r\n", array_merge(["To: $toHeaderValue"], $headers)) . "\r\n\r\n" . $body;

        try {
            bm_smtp_send($host, $from, $recipients, $message);
            return ['ok' => true];
        } catch (Exception $e) {
            error_log('[BM-YV] SMTP: ' . $e->getMessage());
            return ['ok' => false, 'error' => 'No fue posible enviar el correo (SMTP)'];
        }
    }

    /** Quita saltos de línea para evitar inyección de cabeceras */
    function bm_mail_header_text($value) {
        return trim(preg_replace('/[\r\n\t]+/', ' ', (string)$value));
    }

    function bm_mail_encode_header($value) {
        return preg_match('/[^\x20-\x7E]/', $value) ? '=?UTF-8?B?' . base64_encode($value) . '?=' : $value;
    }

    /**
     * Conversación SMTP mínima: EHLO, STARTTLS/SSL, AUTH LOGIN, MAIL FROM, RCPT TO, DATA.
     * @throws Exception
     */
    function bm_smtp_send($host, $from, array $recipients, $message) {
        $port = (int)(getenv('SMTP_PORT') ?: 465);
        $secure = strtolower(trim((string)getenv('SMTP_SECURE')) ?: ($port === 465 ? 'ssl' : 'tls'));
        $user = (string)getenv('SMTP_USER');
        $pass = (string)getenv('SMTP_PASS');

        $context = stream_context_create(['ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'SNI_enabled' => true,
            'peer_name' => $host,
        ]]);
        $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $socket = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $context);
        if (!$socket) {
            throw new Exception("No se pudo conectar a $remote ($errno $errstr)");
        }
        stream_set_timeout($socket, 20);

        $read = function () use ($socket) {
            $response = '';
            while (($line = fgets($socket, 1024)) !== false) {
                $response .= $line;
                // Las respuestas multilínea usan "250-", la última "250 "
                if (strlen($line) < 4 || $line[3] === ' ') {
                    break;
                }
            }
            return $response;
        };
        $command = function ($cmd, array $expected, $logCmd = null) use ($socket, $read) {
            if ($cmd !== null) {
                fwrite($socket, $cmd . "\r\n");
            }
            $response = $read();
            $code = (int)substr($response, 0, 3);
            if (!in_array($code, $expected, true)) {
                $shown = $logCmd ?? ($cmd ?? 'saludo');
                throw new Exception("Respuesta inesperada a \"$shown\": " . trim($response));
            }
            return $response;
        };

        try {
            $ehloHost = preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['SERVER_NAME'] ?? '') ?: 'brandmeisteryv.net';
            $command(null, [220]);
            $ehlo = $command("EHLO $ehloHost", [250]);

            if ($secure === 'tls') {
                $command('STARTTLS', [220]);
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
                    throw new Exception('No se pudo iniciar TLS');
                }
                $ehlo = $command("EHLO $ehloHost", [250]);
            }

            if ($user !== '' && stripos($ehlo, 'AUTH') !== false) {
                $command('AUTH LOGIN', [334]);
                $command(base64_encode($user), [334], '[usuario]');
                $command(base64_encode($pass), [235], '[contraseña]');
            }

            $command("MAIL FROM:<$from>", [250]);
            foreach ($recipients as $rcpt) {
                $command("RCPT TO:<$rcpt>", [250, 251]);
            }
            $command('DATA', [354]);

            // Normalizar saltos de línea y aplicar "dot-stuffing"
            $data = preg_replace('/\r?\n/', "\r\n", $message);
            $data = preg_replace('/^\./m', '..', $data);
            fwrite($socket, $data . "\r\n.\r\n");
            $command(null, [250], 'fin de DATA');

            fwrite($socket, "QUIT\r\n");
        } finally {
            fclose($socket);
        }
    }

    /**
     * Plantilla HTML de marca para los correos del portal.
     * $bodyHtml ya debe venir escapado; $button es opcional ['label' => ..., 'url' => ...].
     */
    function bm_mail_layout($title, $bodyHtml, ?array $button = null) {
        $titleEsc = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $buttonHtml = '';
        if ($button !== null) {
            $url = htmlspecialchars($button['url'], ENT_QUOTES, 'UTF-8');
            $label = htmlspecialchars($button['label'], ENT_QUOTES, 'UTF-8');
            $buttonHtml = '<p style="margin:28px 0;text-align:center"><a href="' . $url . '" style="display:inline-block;background:#E8452C;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:8px">' . $label . '</a></p>'
                . '<p style="font-size:12px;color:#64748B;word-break:break-all">Si el botón no funciona, copia este enlace en tu navegador:<br>' . $url . '</p>';
        }
        return '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' . $titleEsc . '</title></head>'
            . '<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 12px"><tr><td align="center">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">'
            . '<tr><td style="background:#0F172A;padding:18px 28px;color:#ffffff;font-weight:700;font-size:16px">BrandMeister Venezuela <span style="color:#F59E0B">· TG 734</span></td></tr>'
            . '<tr><td style="padding:28px;font-size:15px;line-height:1.6">'
            . '<h1 style="font-size:20px;margin:0 0 16px">' . $titleEsc . '</h1>'
            . $bodyHtml . $buttonHtml
            . '</td></tr>'
            . '<tr><td style="padding:16px 28px;background:#F8FAFC;font-size:12px;color:#64748B">Enviado desde el Backoffice de <a href="https://brandmeisteryv.net" style="color:#E8452C">brandmeisteryv.net</a></td></tr>'
            . '</table></td></tr></table></body></html>';
    }
}
