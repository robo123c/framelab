import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

const appUrl = process.env.FRAMELAB_APP_URL?.replace(/\/$/, "");
const workerId = Number(process.env.FRAMELAB_WORKER_ID);
const token = process.env.FRAMELAB_WORKER_TOKEN;
const pollInterval = Number(process.env.POLL_INTERVAL_MS ?? 5000);

if (!appUrl || !Number.isInteger(workerId) || !token) {
  throw new Error("Set FRAMELAB_APP_URL, FRAMELAB_WORKER_ID, and FRAMELAB_WORKER_TOKEN before starting the worker.");
}

const client = createTRPCProxyClient({
  links: [httpBatchLink({ url: `${appUrl}/api/trpc`, transformer: superjson })],
});

async function processJob(claim) {
  const { job, project, assets } = claim;
  await client.worker.updateJob.mutate({ workerId, token, jobId: job.id, status: "processing", progress: 10 });

  // This starter deliberately does not choose a transcoder for the operator.
  // Configure FRAMEWORK_RENDER_COMMAND to invoke your own renderer with JSON on stdin.
  if (!process.env.FRAMEWORK_RENDER_COMMAND) {
    await client.worker.updateJob.mutate({
      workerId,
      token,
      jobId: job.id,
      status: "review",
      progress: 100,
      errorMessage: "Render plan received. Configure FRAMEWORK_RENDER_COMMAND to perform media processing.",
    });
    console.log(`Job ${job.id} is ready for review; no renderer is configured.`);
    return;
  }

  // The operator-owned command receives only the authorized plan and asset metadata.
  // A production adapter should download expiring URLs and upload its result to operator-controlled storage.
  const payload = JSON.stringify({ job, project, assets });
  const command = process.env.FRAMEWORK_RENDER_COMMAND;
  const { spawn } = await import("node:child_process");
  const child = spawn(command, { shell: true, stdio: ["pipe", "pipe", "inherit"] });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stdin.end(payload);
  const exitCode = await new Promise((resolve) => child.on("close", resolve));
  if (exitCode === 0) {
    let artifact = {};
    try { artifact = JSON.parse(output.trim() || "{}"); } catch { artifact = {}; }
    if (artifact.outputUrl) {
      await client.worker.updateJob.mutate({ workerId, token, jobId: job.id, status: "completed", progress: 100, outputKey: artifact.outputKey ?? null, outputUrl: artifact.outputUrl });
      console.log(`Job ${job.id} completed with an operator-hosted export.`);
    } else {
      await client.worker.updateJob.mutate({ workerId, token, jobId: job.id, status: "review", progress: 100, errorMessage: "Renderer exited successfully but did not return an outputUrl JSON payload." });
      console.log(`Job ${job.id} is ready for review; renderer returned no export URL.`);
    }
  } else {
    await client.worker.updateJob.mutate({ workerId, token, jobId: job.id, status: "failed", progress: 100, errorMessage: `Configured renderer exited with code ${exitCode}.` });
  }
}

async function tick() {
  try {
    await client.worker.heartbeat.mutate({ workerId, token });
    const claim = await client.worker.claimNext.mutate({ workerId, token });
    if (claim.kind === "job") await processJob(claim);
  } catch (error) {
    console.error("Worker tick failed:", error instanceof Error ? error.message : error);
  }
}

await tick();
setInterval(tick, Math.max(pollInterval, 1000));
