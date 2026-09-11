<?php
/**
 * PLACEHOLDER — delete this when Symfony lands.
 *
 * The Symfony application does not exist yet. Until it does, this page reports
 * whether every backing service in compose.yaml is reachable from the PHP
 * container, which is the thing you actually want to know after `make up`.
 *
 * See DEVELOPMENT.md for how to scaffold Symfony over the top of it.
 */

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');

/** @return array{ok:bool,detail:string} */
function check(callable $probe): array
{
    try {
        return ['ok' => true, 'detail' => $probe()];
    } catch (Throwable $e) {
        return ['ok' => false, 'detail' => $e->getMessage()];
    }
}

$checks = [
    'PHP' => check(static fn (): string => PHP_VERSION),

    'intl / ICU' => check(static function (): string {
        if (!extension_loaded('intl')) {
            throw new RuntimeException('intl extension not loaded');
        }
        // The formatting Imvite depends on, exercised rather than assumed.
        $fmt = new IntlDateFormatter('sq_AL', IntlDateFormatter::FULL, IntlDateFormatter::NONE, 'Europe/Belgrade');
        $sq = $fmt->format(new DateTimeImmutable('2026-07-18'));
        $hijri = (new IntlDateFormatter(
            'ar_SA@calendar=islamic-umalqura',
            IntlDateFormatter::LONG,
            IntlDateFormatter::NONE,
            'Asia/Riyadh',
            IntlDateFormatter::TRADITIONAL
        ))->format(new DateTimeImmutable('2026-07-18'));

        return sprintf('ICU %s · sq: %s · hijri: %s', INTL_ICU_VERSION, $sq, $hijri);
    }),

    'PostgreSQL' => check(static function (): string {
        $url = getenv('DATABASE_URL') ?: '';
        $p = parse_url($url);
        if ($p === false || !isset($p['host'])) {
            throw new RuntimeException('DATABASE_URL not set or unparseable');
        }
        $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $p['host'], $p['port'] ?? 5432, ltrim($p['path'] ?? '', '/'));
        $pdo = new PDO($dsn, $p['user'] ?? '', rawurldecode($p['pass'] ?? ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3,
        ]);
        $version = $pdo->query('SHOW server_version')->fetchColumn();
        $ext = $pdo->query("SELECT string_agg(extname, ', ' ORDER BY extname) FROM pg_extension WHERE extname IN ('citext','pg_trgm')")->fetchColumn();
        $coll = $pdo->query("SELECT count(*) FROM pg_collation WHERE collname LIKE '%\\_icu'")->fetchColumn();

        return sprintf('server %s · extensions: %s · %d ICU collations', $version, $ext ?: 'none', $coll);
    }),

    'Redis' => check(static function (): string {
        if (!extension_loaded('redis')) {
            throw new RuntimeException('redis extension not loaded');
        }
        $r = new Redis();
        $r->connect('redis', 6379, 2.0);
        $pong = $r->ping();

        return is_string($pong) ? trim($pong, '+') : 'connected';
    }),

    'OG render service' => check(static function (): string {
        $url = rtrim(getenv('OG_SERVICE_URL') ?: 'http://og:3000', '/') . '/healthz';
        $body = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 5]]));
        if ($body === false) {
            throw new RuntimeException('no response from ' . $url);
        }

        return trim($body);
    }),

    'Mailpit (SMTP)' => check(static function (): string {
        $fp = @fsockopen('mailpit', 1025, $errno, $errstr, 3);
        if ($fp === false) {
            throw new RuntimeException($errstr ?: 'connection refused');
        }
        $banner = trim((string) fgets($fp));
        fclose($fp);

        return $banner ?: 'connected';
    }),
];

$allOk = array_reduce($checks, static fn (bool $c, array $r): bool => $c && $r['ok'], true);
http_response_code($allOk ? 200 : 503);
?>
<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Imvite — stack check</title>
<style>
  :root { color-scheme: light dark; --ok: #1c7a4a; --bad: #b3261e; }
  body { font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
         max-inline-size: 46rem; margin-inline: auto; padding: 3rem 1.25rem; }
  h1 { font-size: 1.35rem; margin-block-end: .25rem; }
  p.lede { margin-block-start: 0; opacity: .75; }
  table { inline-size: 100%; border-collapse: collapse; margin-block-start: 1.5rem; }
  th, td { text-align: start; padding: .6rem .5rem; border-block-end: 1px solid color-mix(in oklch, currentColor 15%, transparent); vertical-align: top; }
  th { inline-size: 11rem; font-weight: 600; }
  td.state { inline-size: 4.5rem; font-weight: 600; }
  .ok { color: var(--ok); } .bad { color: var(--bad); }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .92em; word-break: break-word; }
  footer { margin-block-start: 2rem; padding-block-start: 1rem; border-block-start: 1px solid color-mix(in oklch, currentColor 15%, transparent); opacity: .75; }
</style>
</head>
<body>
  <h1>Imvite stack check</h1>
  <p class="lede">Placeholder front controller. The Symfony application has not been scaffolded yet.</p>

  <table>
    <tbody>
    <?php foreach ($checks as $name => $result): ?>
      <tr>
        <th scope="row"><?= htmlspecialchars((string) $name, ENT_QUOTES) ?></th>
        <td class="state <?= $result['ok'] ? 'ok' : 'bad' ?>"><?= $result['ok'] ? 'ok' : 'FAIL' ?></td>
        <td><code><?= htmlspecialchars($result['detail'], ENT_QUOTES) ?></code></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>

  <footer>
    Replace this file by scaffolding Symfony into <code>app/</code> — see <code>DEVELOPMENT.md</code>.
  </footer>
</body>
</html>
