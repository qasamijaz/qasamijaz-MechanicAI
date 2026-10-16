# Model selection and installation

## Speech recognition — whisper.cpp
- Repository: https://github.com/ggml-org/whisper.cpp
- Multilingual model: `base` (NOT `base.en`; Danish needs multilingual support).
- Windows setup: run `powershell -ExecutionPolicy Bypass -File scripts/setup-whisper-windows.ps1` from repository root.
- This downloads the model into `.local-models/whisper.cpp/models/` and does **not** integrate transcription into the web UI yet.
- Building whisper.cpp additionally requires CMake and a C++ compiler. The browser's Web Speech API remains the current prototype voice implementation.

## 3D generation — TRELLIS.2
- Model: https://huggingface.co/microsoft/TRELLIS.2-4B
- Requires a Linux environment and an NVIDIA GPU with at least 24 GB VRAM per upstream documentation.
- Do not automatically download large model weights on a normal development PC. Benchmark separately once hardware is known.
- Generated 3D geometry must not be used as authoritative mechanical geometry.

## Hunyuan3D 2.1 — excluded
- License: https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/blob/main/LICENSE
- The community license excludes the European Union, so this model is excluded from MechanicAI's current selection.

## 3D reference assets
Use a licensed, verified GLB/GLTF mechanical model. A generated approximation must be labelled illustrative.
Do not redistribute copyrighted Suzuki manuals or CAD assets without authorization.

## Status
Model acquisition is opt-in; weights are not stored in GitHub. Neither local STT nor 3D generation is wired into the web prototype yet.
