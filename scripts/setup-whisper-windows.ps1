$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$external = Join-Path $root ".local-models"
New-Item -ItemType Directory -Force -Path $external | Out-Null
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Git is required." }
if (-not (Test-Path (Join-Path $external "whisper.cpp"))) {
  git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git (Join-Path $external "whisper.cpp")
}
Push-Location (Join-Path $external "whisper.cpp")
try {
  & .\models\download-ggml-model.cmd base
  if ($LASTEXITCODE -ne 0) { throw "Whisper model download failed." }
  Write-Host "Downloaded multilingual Whisper base model. To build whisper.cpp install CMake and a C++ compiler."
} finally { Pop-Location }
