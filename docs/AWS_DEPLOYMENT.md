# Hosting on AWS

No cloud resources have been created or deployed. Hosting and Bedrock can incur charges. Set a budget, choose resources after measuring requirements and stop the model host after the demo.

The smallest deployment is one suitable Linux EC2 host running the official Decider 2B server on loopback and the Next.js application. Choose CPU/GPU and memory from actual measurements, not another machine's latency claim.

## Boundaries

- Keep Decider on 127.0.0.1:8099; never open its port in a public security group.
- Serve the app behind your existing HTTPS proxy/load balancer. Without HTTPS use an SSH tunnel for a private demo rather than sending access codes over public HTTP.
- Use an instance role scoped to the chosen Bedrock model/profile and region. The SDK credential chain uses that role; never bake keys into the image.
- Require the app access code for live calls. This is shared demo access, not production authentication/rate limiting.
- Sources remain labeled fixtures. No GitHub/Notion customer account is connected and the app does not persist meeting history.

## Container

```sh
docker build -t clashpoint-aws .
```

On the Linux EC2 host start Decider as described in LOCAL_SETUP.md and prepare the environment file locally. On the same host:

```sh
docker run --rm --network host --env-file .env.local clashpoint-aws
```

Linux host networking lets the app reach host-loopback Decider. This is not a generic Docker Desktop recipe. Leave AWS_PROFILE unset when an instance role supplies credentials.

Check /api/runtime, then run smoke:aws against the hosted URL. Only a full successful live trace establishes routing, generation and verification together.

Record code/checkpoint revisions, hardware, warmup, region, Bedrock model/profile, prompt version and threshold with benchmark output. For longer-lived deployments pin the base-image digest as well as the lockfile.

Do not describe an unexecuted deployment as running on AWS. Record the actual execution path for submission. Stop only resources you created for the demo through your account's normal process; no destructive automatic teardown is included.
