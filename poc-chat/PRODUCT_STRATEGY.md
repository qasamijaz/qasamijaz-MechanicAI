# MechanicAI — Produktstrategi og vej mod en skalerbar virksomhed

**Status:** Strategisk retning / arbejdshypotese  
**Dato:** 2026-10-18  
**Scope:** MechanicAI (ikke DeenRoutine)  
**Beslutning:** Fortsæt med en smal, dokumentationsforankret POC. Prioritér visuel opgaveudførelse over indkøbskurv.

## 1. Vision

MechanicAI skal være en AI-drevet arbejdsassistent, der hjælper mennesker med at **udføre fysiske tekniske opgaver** — ikke blot føre en samtale om dem.

**Positionering:** Fra spørgsmål til verificeret handling: forstå maskinen, find den rigtige komponent, vis den, guid ét trin ad gangen, og dokumentér resultatet.

Vi konkurrerer ikke på generel chat, stemme, kamera eller 3D alene. Disse kapabiliteter findes allerede hos andre. Differentieringen skal være **sammenhængen mellem maskinidentifikation, troværdige kilder, visuel præcision og gennemførelse af en konkret opgave**.

## 2. Produktprincipper

1. **Opgaven er centrum.** Brugerens mål er at løse et problem, ikke at chatte.
2. **Kilder før sikkerhed i stemmen.** Maskinspecifikke mål, momenter, placeringer og procedurer skal forankres i verificerede kilder; ingen opfundne specifikationer.
3. **Visuel præcision er vigtigere end visuel effekt.** Markér kun en komponent, når identifikationen er tilstrækkeligt sikker. Ved tvivl: bed om foto, manual eller bekræftelse.
4. **Ét trin ad gangen.** Korte instruktioner, tydelig tilstand og kommandoer som »næste«, »gentag« og »stop«.
5. **Sikkerhed og afgrænsning.** Vis forudsætninger, risici og stopkriterier; ingen usikre anvisninger ved utilstrækkelig information.
6. **Kilde- og versionssporbarhed.** Registrér manual, maskinvariant, procedureversion og usikkerhed.
7. **Modulær arkitektur.** Dialog, dokumentation/RAG, opgavemotor, visualisering og handel skal kunne udvikles og testes separat.

## 3. Prioritering

| Prioritet | Funktion | Begrundelse |
|---|---|---|
| P0 | Korrekt identifikation af model/årgang/variant | Forudsætning for pålidelige råd |
| P0 | Verificeret manual- og proceduregrundlag | Tillid og sikkerhed |
| P0 | Guidet opgaveforløb med korte trin | Kerneoplevelse |
| P0 | Visuel lokalisering på dokumenteret foto/diagram/3D | Primær differentiering |
| P1 | Taleinput og kommandoer, synkroniseret med opgavestatus | Hands-free anvendelighed |
| P1 | Opgavelog og genoptagelse | Gentagen værdi |
| P2 | Værktøjs- og reservedelsmatch | Udvidelse af workflow |
| P2 | Indkøbskurv/affiliate/handel | Monetisering efter bevist nytte |

**Valg:** Visuel opgavevejledning før automatisk indkøbskurv. Handel må ikke blive den primære POC-demonstration.

## 4. Første vertikale POC

**Afgrænsning:** Én kendt motorcykelvariant, én vedligeholdelsesopgave (fx olieskift), én verificeret kildepakke. Suzuki 2019 er en kandidat, men præcis model/variant og dokumentation skal verificeres før valg.

**Demoforløb:**
1. Brugeren angiver model, årgang og opgave.
2. Systemet verificerer variant og viser dokumentationsgrundlaget.
3. Brugeren spørger: »Hvor sidder bundproppen?«
4. Systemet fremhæver **korrekt, kildeunderstøttet** position i foto/diagram/3D. Hvis ikke muligt, vises ingen opdigtet markering.
5. Systemet guider i korte trin og venter på »næste«.
6. Systemet kontrollerer relevante sikkerhedspunkter og afslutter med en opgavelog.

**Definition of done:** Demonstrationen kan gennemføres på en rigtig enhed uden uverificerede momenttal, komponentpositioner eller delekompatibilitet.

## 5. Teknisk arkitektur (målbillede)

- **Conversation UI / Voice adapter:** Input, output og korte kommandoer.
- **Task state engine:** Struktureret procedure, trin, fremdrift, stop og genoptagelse.
- **Machine identity resolver:** Fabrikat, model, årgang, variant, konfiguration.
- **Evidence layer:** Rettighedsmæssigt anvendelige manualer, kildehenvisninger, versionsstyring og retrieval.
- **Visual grounding:** Forbind verificerede komponent-ID'er til annoterede billeder, tegninger eller 3D-noder.
- **Safety / uncertainty gate:** Blokerer specifikke råd eller visuelle markeringer uden tilstrækkelig evidens.
- **Commerce adapter (senere):** Værktøj, dele og leverandørmatch; klart adskilt fra sikkerhedskritiske råd.

**Vigtigt:** En LLM må ikke frit gætte koordinater på en 3D-model. Opgavemotoren skal vælge fra verificerede komponentrelationer.

## 6. Eksisterende POC kontra mål

Den isolerede conversation-POC på Railway demonstrerer adgangsbeskyttet AI-chat. Den er **ikke** endnu en færdig stemme-/3D-/manualbaseret mekanikerassistent. Den skal bruges til at validere dialog og interaktion — ikke præsenteres som dokumentation for hele produktvisionen.

Ingen ændringer i eksisterende MechanicAI cloud-service eller DeenRoutine uden særskilt beslutning. Hold ny udvikling isoleret og med eksplicit QA-gate.

## 7. Forretningshypoteser

**Kundevalg er åbent:** B2C gør-det-selv eller B2B værksteder/teknikere. Valget skal afgøres med interviews, test og betalingsvillighed — ikke antagelser.

- **B2C-hypotese:** Mindre frustration og større selvtillid ved sjældne reparationer. Mulig abonnements- eller opgavebaseret betaling.
- **B2B-hypotese:** Færre fejl, hurtigere oplæring og kortere opgavetid. Mulig seat-, team- eller virksomhedslicens.
- **Handelshypotese:** Reservedels- og værktøjshandel kan give ekstra omsætning, men bør ikke være første værditilbud.
- **Platformshypotese:** Teknologien kan senere udvides til biler, maskiner og apparater; ingen horisontal lancering før ét segment virker.

**Unicorn er en ambition, ikke en prognose.** Potentialet afhænger af distribution, stærk fastholdelse, betalende kunder, datakvalitet, økonomi og et forsvarligt forspring.

## 8. Validering og målbare gates

### Gate A — Teknisk troværdighed
- Korrekt model-/variantidentifikation i aftalt testdatasæt.
- Alle maskinspecifikke anvisninger kan spores til en kilde.
- Ingen falsk præcis visuel markering i blindtest.
- Brugeren kan stoppe, gentage og fortsætte uden at miste trinstatus.

### Gate B — Faktisk nytte
- Brugere gennemfører den afgrænsede opgave med observerbar hjælp.
- Mål: opgavetid, fejl, afbrydelser, succesrate, tillid og behov for menneskelig assistance.
- Sammenlign med almindelig manual og generel AI-assistent.

### Gate C — Betalingsvillighed
- Interview og test både B2C og B2B.
- Indhent reelle betalingssignaler (pilotbetaling/LOI, hvor relevant).
- Vælg primær målgruppe på baggrund af data.

### Gate D — Skalerbarhed
- Undersøg om ny maskinmodel/procedure kan onboardes med rimelig indsats og høj kvalitet.
- Mål indholds- og verificeringsomkostning pr. procedure samt enhedsøkonomi.

## 9. Næste arbejdsplan

1. Verificér, at conversation-POC fungerer på iPhone, inklusive adgang og faktisk AI-svar.
2. Fastlæg én præcis maskinvariant og én opgave; fremskaf autoriseret dokumentation.
3. Definér en lille, struktureret procedure med komponent-ID'er og kilder.
4. Byg første synkroniserede visualisering (start med annoteret foto/diagram; 3D kun hvis pålideligt modelgrundlag findes).
5. Tilføj trinmotor og »næste/gentag/stop«; derefter taleadapter.
6. Gennemfør observerede tests og mål resultater mod alternativer.
7. Vælg B2C/B2B ud fra betalings- og brugsdata.
8. Først derefter: reservedelsintegration og indkøbskurv.

## 10. Beslutningslog

- **2026-10-18:** Visuel, dokumentationsforankret opgaveudførelse vælges som primær differentiering.
- **2026-10-18:** Automatisk indkøbskurv nedprioriteres til senere monetiseringslag.
- **2026-10-18:** Første POC afgrænses til én maskinvariant og én procedure.
- **Åbent:** B2C eller B2B som første betalingssegment.
- **Åbent:** Præcis testmaskine, manualrettigheder, datakilder og succesgrænser.

---
*Dette dokument beskriver retning og hypoteser, ikke allerede implementerede funktioner eller dokumenteret markedsstørrelse.*

## 11. Multimodal slutoplevelse — voice-first, ikke voice-only (besluttet 2026-10-18)

**Bindende produktretning:** MechanicAI skal ende som en naturlig **tovejs lyddialog**, mens **tekst og visuel vejledning** altid kan bruges parallelt eller alene. Den nuværende tekstchat er et teknisk første trin, ikke den tilsigtede slutoplevelse.

### Brugeroplevelse
- **Lyd (primær):** Brugeren taler frit med assistenten og får korte, oplæste svar. Støt tydelige kontrolkommandoer som »næste«, »gentag«, »vent« og »stop«. Undgå unødige afbrydelser fra værkstedsstøj; brug robust turtagning og en tilgængelig manuel kontrol.
- **Tekst (fuldgyldig alternativ kanal):** Vis og bevar instruktioner, dialog, kilder, advarsler og trinstatus. Brugeren kan skrive i stedet for at tale, og lyd kan slås fra.
- **Visuelt (kontekst):** Synkroniser relevante fotos, annoterede diagrammer og senere 3D-komponenter med det aktive trin. Ingen markering uden verificeret kobling mellem maskinvariant, komponent og visualisering.
- **Samme opgavestatus på tværs af kanaler:** Tale, tekst og visualisering skal styres af én fælles task state engine. »Næste« skifter ikke kun lyd, men også synligt trin, instruktion og komponentfokus.
- **Sikkerhed:** Kritiske advarsler skal være synlige i tekst, også når lyd er aktiv. Ingen automatisk udførelse af risikable handlinger; ved usikkerhed stoppes eller afklares trinnet.

### Leverancerækkefølge
1. Stabil tekstchat og dokumenteret AI-respons (nuværende POC).
2. Struktureret trinmotor med tekstkommandoer og eksplicit trinstatus.
3. Tovejs lydadapter med talegenkendelse, talesyntese, turtagning og værkstedsstøj-test.
4. Synkroniseret foto/diagram for verificerede komponenter; 3D efter behov og datakvalitet.
5. Multimodal QA på rigtige opgaver, inklusive lyd-afbrud, gentagelse, manuel overtagelse og genoptagelse.

### Forretningsmæssigt kvalitetskriterium
En voice-first oplevelse skal dokumentere **mindre behov for at slippe værktøjet, færre misforståelser, hurtigere og sikrere opgaveudførelse** end ren chat eller manual. Det er en hypotese, som skal måles — ikke en påstand om allerede bevist effekt.
