# Deploying the MechanicAI static prototype

The GitHub Actions workflow builds the Vite project and uploads the generated `dist/` as a workflow artifact. It does **not** publish to Hugging Face automatically.

## First deployment
1. Run the `Build web prototype` GitHub Actions workflow.
2. Download the `mechanicai-static-site` artifact.
3. Upload the files inside `dist/` to the root of the existing Hugging Face Static Space `QasamMekAI/MechanicAI`, keeping the Space's required README front matter.
4. Confirm the Space serves `index.html` and the asset files.

## Future automation
A deployment workflow can be enabled after creating a Hugging Face fine-grained write token, restricted to the Space, and saving it only as a GitHub Actions secret. Never commit tokens or copy secrets into the public Space.

## Security
This is a public, static, illustrative demo; no manuals, private data, paid AI APIs or secrets are included.
