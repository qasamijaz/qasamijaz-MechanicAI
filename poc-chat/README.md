# MechanicAI – isoleret samtale-POC

Dette er **en separat prototype**, ikke en erstatning for den eksisterende 3D-app.
Den har mobiltilpasset chat, fortsættelse af samtaler, eksempelspørgsmål, nulstilling og serverbaseret invitation.

## Status og sikkerhed
- Ikke deployet. Intet API-forbrug indtil du selv angiver en OpenAI API-nøgle på serveren.
- OpenAI API faktureres separat fra ChatGPT Plus/Pro.
- Modellen er konfigurerbar via `MECHANICAI_MODEL`, standard `gpt-4o-mini`. Verificér modeladgang og pris før aktivering.
- `MECHANICAI_MAX_CALLS` (standard 30) er en **lokal forespørgselskvote**, ikke et præcist loft på 50 kr. Brug derudover udbyderens budgetkontrol og kontrollér priser.
- Kvoten nulstilles ved genstart; kræver persistent kvoteregister til offentlig pilot.
- Ingen billedupload, stemmeintegration eller verificerede manualer i denne version.
- Før offentlig test: TLS, sikker adgangskontrol, persistent kvote, log-/privatlivspolitik og belastningstest. Denne prototype må ikke eksponeres direkte uden disse.
- Den eksisterende Railway-backend, Ollama-service og DeenRoutine røres ikke.

## Lokal prøve
```sh
export OPENAI_API_KEY="server-only-api-key"
export MECHANICAI_POC_INVITE="lang-tilfaeldig-testkode"
export MECHANICAI_MAX_CALLS="30"
python poc-chat/server.py
```
Besøg http://127.0.0.1:8766. Brug aldrig API-nøglen i Vite-variabler eller klientkode.
