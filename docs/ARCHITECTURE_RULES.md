# MechanicAI — Architecture Rules (mandatory)

## Modular by default
- Each module owns one capability and has a documented public interface, inputs, outputs, errors, and tests.
- Modules must not import implementation details from other modules. Integration occurs through adapters.
- UI, document discovery, PDF ingestion, retrieval, speech, vision, geometry, and guided workflows remain independent.
- No direct dependencies between vendor/model implementations and domain logic.
- Existing scripts in `scripts/` are **prototypes**, not approved modular production services. Migrate them behind interfaces before integration.

## Open-source-first selection
Before implementing a capability:
1. Search GitHub and Hugging Face for maintained, suitable projects/models.
2. Record upstream URL, exact version/revision, license, dependencies, runtime/hardware needs, data handling, and maintenance/security signals.
3. Check commercial-use and redistribution restrictions, including model weights and training-data caveats.
4. Compare at least one alternative when practical.
5. Prefer wrapping upstream software over copying/forking it; keep upgrades possible.
6. If no suitable upstream exists, document why custom code is necessary.

## Required modules
- `source-discovery`: approved-domain source discovery, robots/terms checks, provenance.
- `document-ingestion`: licensed PDF parsing, metadata and page references.
- `document-index`: canonical vehicle/document/part identity, versioning, verification.
- `retrieval`: evidence retrieval with source/page citations and confidence.
- `diagram-viewer`: licensed technical diagrams, part anchors, selection.
- `three-d-viewer`: clearly labeled illustrative or verified geometry.
- `speech`: speech-to-text and text-to-speech adapters.
- `vision`: optional photo understanding, uncertainty and device privacy.
- `guide-engine`: step-by-step orchestration from approved evidence only.

## Release gates
- A model/year/market/VIN mismatch blocks repair-specific claims.
- Unverified OCR, image classification, and generated 3D never establish bolt identity, torque, fluids, or procedure.
- Preserve citations and rights/permission metadata from source to UI.
- Test each module independently and with integration contracts.
- Never auto-publish third-party manuals or bypass access controls.
- Prefer local/open-source processing; remote paid services require explicit approval.
- No deployment, merge, or claims of successful QA without observed results.

## Suggested repository layout (target, not yet migrated)
```
modules/
  source-discovery/
  document-ingestion/
  document-index/
  retrieval/
  diagram-viewer/
  three-d-viewer/
  speech/
  vision/
  guide-engine/
apps/web/
services/document-worker/
docs/architecture/
```

## First approved candidates (evaluate, do not assume suitability)
- Crawl4AI — https://github.com/unclecode/crawl4ai
- Scrapy — https://github.com/scrapy/scrapy
- Playwright — https://github.com/microsoft/playwright
- Docling — https://github.com/docling-project/docling
- Qdrant — https://github.com/qdrant/qdrant
- Transformers.js — https://github.com/huggingface/transformers.js

These are candidates, not installed or security-verified components.
