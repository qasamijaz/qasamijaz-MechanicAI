# Local model benchmark – pilot cost/quality gate

Run only after an operator explicitly installs Ollama and downloads
a chosen model. No automatic model download, hosted inference or
paid services are used.

```sh
python pilot/benchmark_local.py --model qwen2.5:3b --output pilot-results.json
```

The benchmark uses synthetic Danish prompts across mechanics, electrical,
home improvement, cooking and uncertainty. It records elapsed time,
Ollama-provided token metrics, answers and basic keyword flags.

**Do not interpret keyword checks as verified safety or accuracy.**
Review every answer manually for technical hallucinations, unsafe advice,
useful clarification questions and Danish language quality.

Run the same prompts with candidate models on the **same hardware**,
including cold/warm starts. Record RAM/CPU usage separately, concurrent
users, and peak latency. Do not publish pilot-results.json containing
real user prompts or upload it to a public repository.

For a 500 DKK/month cost target, measure fixed hosting, storage,
network, model capacity and operational overhead separately. Request
quotas alone do not enforce a DKK spending cap.
