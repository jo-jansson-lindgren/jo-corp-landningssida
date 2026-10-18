# jo-corp-landningssida

Landningssida för JO Marketing Solutions — inlägg, grafik och schemaläggning på Instagram och Facebook för lokala företag.

Driftas på Cloudflare Pages (projektet `jo-corp-landningssida`, https://jo-corp-landningssida.pages.dev). Push till `main` bygger och publicerar automatiskt — kontrollera ändå Deployments-vyn efter varje push.

## Struktur

- `*.html` — en sida per menyval, plus case-sidor, juridiksidor och `404.html`.
- `assets/` — CSS, JS, bilder, logga och favicon. Alla sidor hämtar sina filer härifrån.
- `media/` — startfilmen och annonsvideor (9:16) som Metricool hämtar via URL. Annonsvideorna länkas inte från sajten men ska ligga kvar.
- `functions/api/chat.js` — backend för chattassistenten.

## Chattassistent

- Widget: `assets/chat.js` + `assets/chat.css`, inkluderas på alla sidor.
- Backend: `functions/api/chat.js` (Cloudflare Pages Function, `POST /api/chat`).
- Kräver en AI-koppling i Cloudflare: Pages-projektet → Settings → Bindings → Add → Workers AI, variabelnamn `AI`.
- Modellen byts utan kodändring med miljövariabeln `CHAT_MODEL` (standard: `@cf/meta/llama-3.1-8b-instruct-fp8`).
- Kunskapen ligger som text i `functions/api/chat.js` (`KUNSKAP`). Ändras priser, paket eller texter på sidan måste den uppdateras där också.
