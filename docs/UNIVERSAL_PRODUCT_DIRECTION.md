# MechanicAI — Universal task platform (product direction)

MechanicAI is **not a Suzuki-specific app**. Motorcycle maintenance is the first demo only.

## Core interaction
User speaks or types a goal -> intent/task planner -> specialist capability adapters -> evidence and safety validation -> visual output (2D diagram, 3D scene, floorplan, annotated photo) or step-by-step guide -> interactive voice follow-up.

## Domains (plugins, not hardcoded app branches)
- Vehicle maintenance: oil changes, diagnostics, parts diagrams; optional plate/VIN lookup
- Home improvement: fences, shelves, furniture, lighting placement
- Home and building design: conceptual floorplans, room layout, visualization
- General equipment and mechanical repair

## Module contracts
- `task-intake`: utterance, locale, images, measurements -> normalized goal and constraints
- `task-planner`: goal -> ordered tasks, prerequisites, unknowns, safety class
- `knowledge-connectors`: open-source-first adapters for permitted manuals, regulations and product data
- `visualization`: pluggable 2D diagrams, 3D scenes, floorplans and photo overlays
- `guided-execution`: voice-first step progression, pause/confirm/rewind, state
- `domain-plugins`: vehicle, electrical, construction, architecture, general DIY
- `vehicle-registry`: optional user-supplied plate/VIN lookup, only when useful; no registration required for general demo

## Safety
- Show conceptual visualizations as conceptual, not approved construction drawings.
- Electrical wiring, structural work and other regulated tasks require jurisdiction checks and licensed professionals where required.
- Never fabricate measurements, load calculations, wiring diagrams, torque specifications or exact parts compatibility.
- If a specific manual/model is absent, demonstrate the workflow with clearly labelled generic assets.
- No plate/VIN stored or sent to third parties without informed user action.

## Open-source evaluation before coding
Review GitHub/Hugging Face licenses, maintenance and runtime before integrating candidates:
- Blender (geometry authoring), Three.js (web 3D)
- PDF.js and Docling (document display/processing)
- Whisper.cpp / faster-whisper (speech recognition)
- Transformers.js and suitable HF models (browser inference)
- Open-source parametric CAD / floorplan tools subject to license and runtime checks

## MVP acceptance scenario
A user says "Design a fence along my driveway" or "Show me how to change oil".
The assistant asks only for essential missing measurements or vehicle information,
then creates a labelled conceptual visualization or evidence-backed step guide,
with conversational step navigation and explicit uncertainty.
