export function redirectPageHtml(destinationUrl: string): string {
  const escaped = destinationUrl
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <meta http-equiv="refresh" content="0;url=${escaped}" />
  <title>Redirecting…</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0e0e0e;
      color: #f0ede6;
      font-family: "DM Mono", monospace;
    }
    p { font-size: 14px; letter-spacing: 0.08em; color: #666; }
  </style>
</head>
<body>
  <p>Redirecting…</p>
  <script>location.replace(${JSON.stringify(destinationUrl)});</script>
</body>
</html>`;
}

export function errorPageHtml(title: string, message: string, status: number): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: #0e0e0e;
      color: #f0ede6;
      font-family: "DM Mono", monospace;
      padding: 24px;
    }
    h1 {
      margin: 0;
      font-family: "Anta", sans-serif;
      font-size: 28px;
      color: #c8f56a;
      font-weight: normal;
    }
    p { margin: 0; font-size: 14px; color: #666; }
    .code { color: #ff8080; font-size: 12px; letter-spacing: 0.12em; }
  </style>
</head>
<body>
  <p class="code">${status}</p>
  <h1>${title}</h1>
  <p>${message}</p>
</body>
</html>`;
}
