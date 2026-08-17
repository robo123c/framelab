import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const anonymousContext = {} as TrpcContext;

describe("FrameLab API boundaries", () => {
  it("requires an authenticated creator before creating a persistent project", async () => {
    const caller = appRouter.createCaller(anonymousContext);
    await expect(caller.project.create({ name: "Night edit" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects malformed worker credentials before it attempts to claim a job", async () => {
    const caller = appRouter.createCaller(anonymousContext);
    await expect(caller.worker.claimNext({ workerId: 1, token: "too-short" })).rejects.toBeDefined();
  });

  it("rejects out-of-range worker progress values before a job update", async () => {
    const caller = appRouter.createCaller(anonymousContext);
    await expect(caller.worker.updateJob({
      workerId: 1,
      token: "framelab_012345678901234567890123",
      jobId: 1,
      status: "processing",
      progress: 101,
    })).rejects.toBeDefined();
  });
});
