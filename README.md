# jo-corp-landningssida

Landningssida för JO Marketing Solutions — digital strategi, varumärke och analys.

Deployas automatiskt till Netlify (jo-marketing-solutions.netlify.app) vid push till `main`.

## Chattassistent

- Widget: `assets/chat.js` + `assets/chat.css`, inkluderas på alla sidor.
- Backend: `functions/api/chat.js` (Cloudflare Pages Function, `POST /api/chat`).
- Kräver en AI-koppling i Cloudflare: Pages-projektet → Settings → Bindings → Add → Workers AI, variabelnamn `AI`.
- Modellen byts utan kodändring med miljövariabeln `CHAT_MODEL` (standard: `@cf/meta/llama-3.1-8b-instruct-fp8`).
- Kunskapen ligger som text i `functions/api/chat.js` (`KUNSKAP`). Ändras priser eller paket på sidan måste den uppdateras där också.
