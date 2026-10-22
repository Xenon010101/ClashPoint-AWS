# Local setup: actual inference

Offline rehearsal is the default. A qualifying demo needs the real Decider 2B checkpoint and a Bedrock model in your AWS account. No credentials, model weights or fabricated inference results are included.

## Start Decider

On Windows use a Linux environment such as WSL2, following the [official inference guide](https://github.com/strands-labs/strands-decider/blob/main/docs/inference.md). If WSL is absent, install/configure it manually first. A GPU is optional; CPU inference can be substantially slower. Base weights alone are approximately 4.5 GB, plus dependencies/checkpoint downloads and RAM.

Inside Linux with Python 3.12:

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install 'strands-decider @ git+https://github.com/strands-labs/strands-decider@d942e55'
strands-decider serve StrandsAgents/strands-decider-2B-qwen3.5-v1-2610 --device cpu --port 8099 --strict-window
```

The code commit is the official version inspected during this build. For CUDA, follow upstream prerequisites and change the device to cuda. First load downloads base weights. Record the actual resolved checkpoint revision; the Hub main revision can change.

Keep the server private: it has no built-in authentication. From Windows check http://127.0.0.1:8099/health. If WSL loopback forwarding is unavailable, use its supported network configuration rather than exposing the model publicly. The response must identify a Strands Decider 2B checkpoint.

## Configure AWS

Use an AWS account with an existing AWS CLI profile or local credential setup. Prefer temporary credentials/SSO. Install the AWS CLI manually if needed.

```sh
aws configure sso --profile clashpoint
aws sso login --profile clashpoint
aws sts get-caller-identity --profile clashpoint
```

These are examples to run yourself; no account has been configured by this build. Ensure your model is available in the account/region. Converse requires bedrock:InvokeModel. Some models require access setup; cross-region profiles need permissions for the profile and destination models. [Converse API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html)

## Configure the app

Copy .env.example to .env.local in your editor:

```dotenv
CLASHPOINT_AWS_ENABLED=true
CLASHPOINT_ACCESS_CODE=<locally generated random code of at least 16 characters>
STRANDS_DECIDER_URL=http://127.0.0.1:8099
AWS_REGION=us-east-1
AWS_PROFILE=clashpoint
BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0
DECIDER_MIN_CONFIDENCE=0.65
INFERENCE_TIMEOUT_MS=120000
```

Choose a Converse-compatible model/profile actually available to your account; this example does not establish entitlement. Never put AWS keys in the browser or repository. The app access code is not an AWS credential. The local environment file is ignored by Git.

Restart pnpm dev. Select **Live AWS inference**, enter the app access code and start. Configuration status alone is not a provider-connectivity check. A cold/slow Decider or failed Bedrock request remains unavailable instead of switching to rehearsal.

## Verify before recording

```sh
pnpm smoke:aws
pnpm eval:router --split development --out decider-development.json
pnpm eval:router --split validation --out decider-validation.json
pnpm eval:router --baseline --split validation --out bedrock-validation.json
```

These runs incur inference/compute costs. A low-confidence smoke result is a failed smoke test, not a reason to force the route. Select the threshold on development cases, document changes and preserve validation cases. Never submit rehearsal as actual model inference.

Use Script or Manual when recording unless microphone recognition has been rehearsed on the hardware. Browser recognition can send audio to the browser vendor and fail independently of the two inference providers.
