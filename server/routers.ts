import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const";
import {
  claimNextRenderJob,
  applyWorkerAnalysis,
  createAssetForProject,
  createProjectForOwner,
  createRenderJobForProject,
  createWorkerForOwner,
  getProjectWorkspace,
  heartbeatWorker,
  listExportsForProject,
  listProjectsForOwner,
  listPresetsForOwner,
  listWorkersForOwner,
  replaceBeatMapForProject,
  replaceTranscriptForProject,
  updateOwnedProject,
  updateWorkerRenderJob,
} from "./db";
import { storagePut } from "./storage";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const projectIdInput = z.object({ projectId: z.number().int().positive() });
const mediaKind = z.enum(["video", "audio", "image", "other"]);
const aspectRatio = z.enum(["9:16", "1:1", "4:5", "16:9"]);
const canvasMode = z.enum(["fit", "fill"]);
const renderStatus = z.enum(["processing", "review", "completed", "failed"]);

function hashWorkerToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  project: router({
    list: protectedProcedure.query(({ ctx }) => listProjectsForOwner(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(160) })).mutation(({ ctx, input }) => createProjectForOwner(ctx.user.id, input.name)),
    workspace: protectedProcedure.input(projectIdInput).query(async ({ ctx, input }) => {
      const workspace = await getProjectWorkspace(ctx.user.id, input.projectId);
      if (!workspace) throw new Error("Project not found");
      return workspace;
    }),
    update: protectedProcedure.input(projectIdInput.extend({
      name: z.string().trim().min(1).max(160).optional(),
      aspectRatio: aspectRatio.optional(),
      canvasMode: canvasMode.optional(),
      activePreset: z.string().trim().min(1).max(64).optional(),
      captionStyle: z.string().trim().min(1).max(64).optional(),
      motionIntensity: z.number().int().min(0).max(100).optional(),
      status: z.enum(["draft", "ready", "archived"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { projectId, ...values } = input;
      const project = await updateOwnedProject(ctx.user.id, projectId, values);
      if (!project) throw new Error("Project not found");
      return project;
    }),
  }),
  asset: router({
    upload: protectedProcedure.input(projectIdInput.extend({
      fileName: z.string().trim().min(1).max(255),
      mediaKind,
      mimeType: z.string().trim().min(1).max(160),
      base64: z.string().min(1).max(20_000_000),
      byteSize: z.number().int().positive().max(15_000_000),
      durationMs: z.number().int().positive().max(3_600_000).nullable().optional(),
      sortOrder: z.number().int().min(0).max(9999).default(0),
    })).mutation(async ({ ctx, input }) => {
      const { base64, projectId, fileName, mediaKind: kind, mimeType, byteSize, durationMs, sortOrder } = input;
      const workspace = await getProjectWorkspace(ctx.user.id, projectId);
      if (!workspace) throw new Error("Project not found");
      const payload = Buffer.from(base64, "base64");
      if (payload.byteLength !== byteSize) throw new Error("Uploaded file size did not match the declared size");
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-160) || "asset";
      const stored = await storagePut(`${ctx.user.id}/projects/${projectId}/assets/${safeName}`, payload, mimeType);
      const asset = await createAssetForProject(ctx.user.id, projectId, { displayName: fileName, mediaKind: kind, storageKey: stored.key, storageUrl: stored.url, mimeType, byteSize, durationMs: durationMs ?? null, sortOrder });
      if (!asset) throw new Error("Project not found");
      return asset;
    }),
  }),
  timing: router({
    replaceTranscript: protectedProcedure.input(projectIdInput.extend({
      tokens: z.array(z.object({ lineIndex: z.number().int().min(0).max(1000), tokenIndex: z.number().int().min(0).max(1000), text: z.string().trim().min(1).max(512), startMs: z.number().int().min(0).nullable().optional(), endMs: z.number().int().min(0).nullable().optional() })).max(5000),
    })).mutation(async ({ ctx, input }) => {
      const tokens = await replaceTranscriptForProject(ctx.user.id, input.projectId, input.tokens);
      if (!tokens) throw new Error("Project not found");
      return tokens;
    }),
    replaceBeats: protectedProcedure.input(projectIdInput.extend({
      beats: z.array(z.object({ timestampMs: z.number().int().min(0).max(3_600_000), strength: z.number().int().min(1).max(100) })).max(5000),
    })).mutation(async ({ ctx, input }) => {
      const beats = await replaceBeatMapForProject(ctx.user.id, input.projectId, input.beats);
      if (!beats) throw new Error("Project not found");
      return beats;
    }),
  }),
  render: router({
    queue: protectedProcedure.input(projectIdInput.extend({ requestedFormat: z.enum(["mp4", "webm", "mov"]).default("mp4"), plan: z.record(z.string(), z.unknown()) })).mutation(async ({ ctx, input }) => {
      const job = await createRenderJobForProject(ctx.user.id, input.projectId, input.requestedFormat, input.plan);
      if (!job) throw new Error("Project not found");
      return job;
    }),
  }),
  preset: router({
    list: protectedProcedure.query(({ ctx }) => listPresetsForOwner(ctx.user.id)),
  }),
  export: router({
    list: protectedProcedure.input(projectIdInput).query(async ({ ctx, input }) => {
      const projectExports = await listExportsForProject(ctx.user.id, input.projectId);
      if (!projectExports) throw new Error("Project not found");
      return projectExports;
    }),
  }),
  worker: router({
    list: protectedProcedure.query(({ ctx }) => listWorkersForOwner(ctx.user.id)),
    register: protectedProcedure.input(z.object({ label: z.string().trim().min(1).max(120) })).mutation(async ({ ctx, input }) => {
      const token = `framelab_${randomBytes(24).toString("base64url")}`;
      const worker = await createWorkerForOwner(ctx.user.id, input.label, hashWorkerToken(token), token.slice(-6));
      return { worker, token };
    }),
    heartbeat: publicProcedure.input(z.object({ workerId: z.number().int().positive(), token: z.string().min(20).max(256) })).mutation(async ({ input }) => {
      const worker = await heartbeatWorker(input.workerId, hashWorkerToken(input.token));
      if (!worker) throw new Error("Worker is not authorized");
      return worker;
    }),
    applyAnalysis: publicProcedure.input(z.object({
      workerId: z.number().int().positive(),
      token: z.string().min(20).max(256),
      projectId: z.number().int().positive(),
      tokens: z.array(z.object({ lineIndex: z.number().int().min(0).max(1000), tokenIndex: z.number().int().min(0).max(1000), text: z.string().trim().min(1).max(512), startMs: z.number().int().min(0).nullable().optional(), endMs: z.number().int().min(0).nullable().optional() })).max(5000).optional(),
      beats: z.array(z.object({ timestampMs: z.number().int().min(0).max(3_600_000), strength: z.number().int().min(1).max(100) })).max(5000).optional(),
    }).refine((input) => input.tokens !== undefined || input.beats !== undefined, { message: "Provide transcript tokens or beat markers" })).mutation(async ({ input }) => {
      const { workerId, token, projectId, tokens, beats } = input;
      const workspace = await applyWorkerAnalysis(workerId, hashWorkerToken(token), projectId, { tokens, beats });
      if (!workspace) throw new Error("Worker is not authorized for this project");
      return workspace;
    }),
    claimNext: publicProcedure.input(z.object({ workerId: z.number().int().positive(), token: z.string().min(20).max(256) })).mutation(({ input }) => claimNextRenderJob(input.workerId, hashWorkerToken(input.token))),
    updateJob: publicProcedure.input(z.object({
      workerId: z.number().int().positive(),
      token: z.string().min(20).max(256),
      jobId: z.number().int().positive(),
      status: renderStatus,
      progress: z.number().int().min(0).max(100),
      outputKey: z.string().max(1024).nullable().optional(),
      outputUrl: z.string().max(1200).nullable().optional(),
      errorMessage: z.string().max(4000).nullable().optional(),
    })).mutation(async ({ input }) => {
      const { workerId, token, jobId, ...updates } = input;
      const job = await updateWorkerRenderJob(workerId, hashWorkerToken(token), jobId, updates);
      if (!job) throw new Error("Worker is not authorized for this job");
      return job;
    }),
  }),
});

export type AppRouter = typeof appRouter;
