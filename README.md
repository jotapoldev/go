# jotapol-go

Links cortos por post (`jotapol.com/r/09`) y un tablero para saber qué post o reel trae gente.

- **Redirección:** `/<código>` manda al destino y cuenta el clic. Las previsualizaciones de links y los bots no cuentan.
- **Privacidad:** de cada clic se guarda solo el día, la hora (UTC), el origen (Instagram, TikTok, LinkedIn… según el navegador que lo abre o el referer) y si fue celular o computadora. Nunca IP ni datos de la persona.
- **Tablero (`/admin`):** clics por post, últimos 14 días, de dónde vienen, dispositivo, y las métricas de Instagram que anotás a mano (alcance, guardados, compartidos, me gusta, comentarios) con el porcentaje clic/alcance.

Node 24 sin dependencias: `node:sqlite` guarda todo en `DATA_DIR/go.db`.

## Correr en local

```
ADMIN_TOKEN=una-clave-de-12-o-mas node server.js   # http://localhost:3300/admin
npm test
```

## Variables

| Variable | Por defecto | |
| --- | --- | --- |
| `ADMIN_TOKEN` | (obligatoria) | Clave del tablero, 12 caracteres o más |
| `DATA_DIR` | `./data` | Dónde vive la base; en Railway, el volumen (`/data`) |
| `PORT` | `3300` | |
| `HOME_URL` | `https://jotapol.com` | A dónde va la raíz sin código |
| `BASE_PATH` | (vacío) | Prefijo cuando vive detrás de otra web. En producción `/r`: la web de jotapol.com (Caddy) le pasa `/r/*` a este servicio por la red interna de Railway |

## Cómo usarlo con los posts

1. En `/admin`, creá un link por post: código `09`, destino el repo o la demo.
2. Usá `jotapol.com/r/09` en la story (sticker de link), en la bio ese día o en el texto.
3. Cuando el post tenga un par de días, copiá alcance, guardados y compartidos de Instagram al formulario del tablero.
