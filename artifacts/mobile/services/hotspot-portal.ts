/**
 * Hotspot portal HTML template generator.
 * Generates a custom MikroTik login page with user branding.
 * Template uses MikroTik built-in variables: $(link-login-only), $(link-orig),
 * $(username), $(error), $(if error) / $(endif error).
 */

export interface PortalConfig {
  businessName: string;
  primaryColor: string;
}

export const PRESET_COLORS = [
  { label: 'Azul',     value: '#2563EB' },
  { label: 'Verde',    value: '#16A34A' },
  { label: 'Naranja',  value: '#EA580C' },
  { label: 'Morado',   value: '#7C3AED' },
  { label: 'Rojo',     value: '#DC2626' },
  { label: 'Cian',     value: '#0891B2' },
];

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  businessName: '',
  primaryColor: '#2563EB',
};

/**
 * Generates the HTML for a custom MikroTik hotspot login page.
 * All text is ASCII-safe (no accented characters) so the base64
 * encoder works correctly without a full UTF-8 encoder.
 * The businessName is HTML-escaped before insertion.
 */
export function generateHotspotHTML(config: PortalConfig): string {
  // HTML-escape and convert non-ASCII to numeric entities so the
  // resulting HTML string is fully ASCII-safe for base64 encoding.
  const safeName = config.businessName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .split('')
    .map((c) => (c.charCodeAt(0) > 127 ? `&#${c.charCodeAt(0)};` : c))
    .join('');
  const color = config.primaryColor;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#1a2535 0%,#263347 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.card{background:#fff;border-radius:18px;padding:36px 28px;width:320px;box-shadow:0 24px 64px rgba(0,0,0,.35);text-align:center}
.logo{font-size:24px;font-weight:700;color:${color};letter-spacing:-.5px;margin-bottom:6px}
.sub{font-size:13px;color:#888;margin-bottom:24px;line-height:1.4}
.err{background:#fff0f0;color:#c00;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px;text-align:left}
input{width:100%;padding:12px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none;margin-bottom:12px;transition:border-color .2s;color:#111}
input:focus{border-color:${color}}
button{width:100%;padding:13px;background:${color};color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;transition:opacity .2s;margin-top:2px}
button:active{opacity:.85}
.foot{margin-top:22px;font-size:11px;color:#bbb}
</style>
</head>
<body>
<div class="card">
<div class="logo">${safeName}</div>
<div class="sub">Ingresa tus datos para conectarte a internet</div>
\$(if error)<div class="err">\$(error)</div>\$(endif error)
<form action="\$(link-login-only)" method="post">
<input type="hidden" name="dst" value="\$(link-orig)">
<input type="text" name="username" placeholder="Usuario" value="\$(username)" autocomplete="off">
<input type="password" name="password" placeholder="Clave" autocomplete="off">
<button type="submit">Conectar</button>
</form>
<div class="foot">Servicio de internet por hotspot</div>
</div>
</body>
</html>`;
}
