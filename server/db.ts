import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assets,
  beatMarkers,
  exports,
  InsertUser,
  presets,
  projects,
  renderJobs,
  transcriptTokens,
  users,
  workers,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

function getInsertId(result: unknown): number {
  const packet = Array.isArray(result) ? result[0] : result;
  const insertId = (packet as { insertId?: number }).insertId;
  if (!insertId) throw new Error("Database insert did not return an identifier");
  return Number(insertId);
}

export async function listProjectsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.updatedAt));
}

export async function getOwnedProject(ownerId: number, projectId: number) {
  const db = await requireDb();
  const rows = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId))).limit(1);
  return rows[0];
}

export async function createProjectForOwner(ownerId: number, name: string) {
  const db = await requireDb();
  const result = await db.insert(projects).values({ ownerId, name });
  const projectId = getInsertId(result);
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) throw new Error("Created project could not be loaded");
  return project;
}

export async function updateOwnedProject(
  ownerId: number,
  projectId: number,
  values: Partial<Pick<typeof projects.$inferInsert, "name" | "aspectRatio" | "canvasMode" | "activePreset" | "captionStyle" | "motionIntensity" | "status">>,
) {
  const db = await requireDb();
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) return undefined;
  await db.update(projects).set(values).where(eq(projects.id, projectId));
  return getOwnedProject(ownerId, projectId);
}

export async function getProjectWorkspace(ownerId: number, projectId: number) {
  const db = await requireDb();
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) return undefined;
  const [projectAssets, tokens, beats, jobs, projectExports] = await Promise.all([
    db.select().from(assets).where(eq(assets.projectId, projectId)).orderBy(asc(assets.sortOrder), asc(assets.id)),
    db.select().from(transcriptTokens).where(eq(transcriptTokens.projectId, projectId)).orderBy(asc(transcriptTokens.lineIndex), asc(transcriptTokens.tokenIndex)),
    db.select().from(beatMarkers).where(eq(beatMarkers.projectId, projectId)).orderBy(asc(beatMarkers.timestampMs)),
    db.select().from(renderJobs).where(eq(renderJobs.projectId, projectId)).orderBy(desc(renderJobs.updatedAt)),
    db.select().from(exports).where(eq(exports.projectId, projectId)).orderBy(desc(exports.createdAt)),
  ]);
  return { project, assets: projectAssets, tokens, beats, jobs, exports: projectExports };
}

export async function createAssetForProject(
  ownerId: number,
  projectId: number,
  values: Pick<typeof assets.$inferInsert, "displayName" | "mediaKind" | "storageKey" | "storageUrl" | "mimeType" | "byteSize" | "durationMs" | "sortOrder">,
) {
  const db = await requireDb();
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) return undefined;
  const result = await db.insert(assets).values({ projectId, ...values });
  const assetId = getInsertId(result);
  const created = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  return created[0];
}

export async function replaceTranscriptForProject(
  ownerId: number,
  projectId: number,
  tokens: Array<{ lineIndex: number; tokenIndex: number; text: string; startMs?: number | null; endMs?: number | null }>,
) {
  const db = await requireDb();
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) return undefined;
  await db.transaction(async (tx) => {
    await tx.delete(transcriptTokens).where(eq(transcriptTokens.projectId, projectId));
    if (tokens.length) await tx.insert(transcriptTokens).values(tokens.map((token) => ({ projectId, ...token })));
  });
  return db.select().from(transcriptTokens).where(eq(transcriptTokens.projectId, projectId)).orderBy(asc(transcriptTokens.lineIndex), asc(transcriptTokens.tokenIndex));
}

export async function replaceBeatMapForProject(
  ownerId: number,
  projectId: number,
  beats: Array<{ timestampMs: number; strength: number }>,
) {
  const db = await requireDb();
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) return undefined;
  await db.transaction(async (tx) => {
    await tx.delete(beatMarkers).where(eq(beatMarkers.projectId, projectId));
    if (beats.length) await tx.insert(beatMarkers).values(beats.map((beat) => ({ projectId, ...beat })));
  });
  return db.select().from(beatMarkers).where(eq(beatMarkers.projectId, projectId)).orderBy(asc(beatMarkers.timestampMs));
}

export async function applyWorkerAnalysis(
  workerId: number,
  tokenHash: string,
  projectId: number,
  analysis: {
    tokens?: Array<{ lineIndex: number; tokenIndex: number; text: string; startMs?: number | null; endMs?: number | null }>;
    beats?: Array<{ timestampMs: number; strength: number }>;
  },
) {
  const db = await requireDb();
  const access = await db
    .select({ workerId: workers.id, projectId: projects.id })
    .from(workers)
    .innerJoin(projects, eq(projects.ownerId, workers.ownerId))
    .where(and(eq(workers.id, workerId), eq(workers.tokenHash, tokenHash), eq(projects.id, projectId)))
    .limit(1);
  if (!access[0]) return undefined;
  await db.transaction(async (tx) => {
    if (analysis.tokens) {
      await tx.delete(transcriptTokens).where(eq(transcriptTokens.projectId, projectId));
      if (analysis.tokens.length) await tx.insert(transcriptTokens).values(analysis.tokens.map((token) => ({ projectId, ...token })));
    }
    if (analysis.beats) {
      await tx.delete(beatMarkers).where(eq(beatMarkers.projectId, projectId));
      if (analysis.beats.length) await tx.insert(beatMarkers).values(analysis.beats.map((beat) => ({ projectId, ...beat })));
    }
  });
  return getProjectWorkspace((await db.select({ ownerId: workers.ownerId }).from(workers).where(eq(workers.id, workerId)).limit(1))[0]!.ownerId, projectId);
}

export async function createRenderJobForProject(
  ownerId: number,
  projectId: number,
  requestedFormat: "mp4" | "webm" | "mov",
  planJson: Record<string, unknown>,
) {
  const db = await requireDb();
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) return undefined;
  const result = await db.insert(renderJobs).values({ projectId, requestedFormat, planJson, status: "queued", progress: 0 });
  const jobId = getInsertId(result);
  const created = await db.select().from(renderJobs).where(eq(renderJobs.id, jobId)).limit(1);
  return created[0];
}

export async function listPresetsForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select().from(presets).where(eq(presets.ownerId, ownerId)).orderBy(desc(presets.updatedAt));
}

export async function listExportsForProject(ownerId: number, projectId: number) {
  const db = await requireDb();
  const project = await getOwnedProject(ownerId, projectId);
  if (!project) return undefined;
  return db.select().from(exports).where(eq(exports.projectId, projectId)).orderBy(desc(exports.createdAt));
}

export async function listWorkersForOwner(ownerId: number) {
  const db = await requireDb();
  return db.select({ id: workers.id, label: workers.label, mode: workers.mode, tokenHint: workers.tokenHint, lastSeenAt: workers.lastSeenAt, createdAt: workers.createdAt, updatedAt: workers.updatedAt }).from(workers).where(eq(workers.ownerId, ownerId)).orderBy(desc(workers.updatedAt));
}

export async function createWorkerForOwner(ownerId: number, label: string, tokenHash: string, tokenHint: string) {
  const db = await requireDb();
  const result = await db.insert(workers).values({ ownerId, label, tokenHash, tokenHint });
  const workerId = getInsertId(result);
  const created = await db.select({ id: workers.id, label: workers.label, mode: workers.mode, tokenHint: workers.tokenHint, lastSeenAt: workers.lastSeenAt }).from(workers).where(eq(workers.id, workerId)).limit(1);
  return created[0];
}

export async function heartbeatWorker(workerId: number, tokenHash: string) {
  const db = await requireDb();
  const found = await db.select({ id: workers.id, label: workers.label }).from(workers).where(and(eq(workers.id, workerId), eq(workers.tokenHash, tokenHash))).limit(1);
  const worker = found[0];
  if (!worker) return undefined;
  const now = new Date();
  await db.update(workers).set({ lastSeenAt: now }).where(eq(workers.id, workerId));
  return { ...worker, lastSeenAt: now };
}

export async function claimNextRenderJob(workerId: number, tokenHash: string) {
  const db = await requireDb();
  const workerRows = await db.select().from(workers).where(and(eq(workers.id, workerId), eq(workers.tokenHash, tokenHash))).limit(1);
  const worker = workerRows[0];
  if (!worker) return { kind: "unauthorized" as const };
  await db.update(workers).set({ lastSeenAt: new Date() }).where(eq(workers.id, workerId));
  const jobs = await db
    .select({ job: renderJobs, project: projects })
    .from(renderJobs)
    .innerJoin(projects, eq(renderJobs.projectId, projects.id))
    .where(and(eq(renderJobs.status, "queued"), eq(projects.ownerId, worker.ownerId)))
    .orderBy(asc(renderJobs.requestedAt))
    .limit(1);
  const next = jobs[0];
  if (!next) return { kind: "empty" as const };
  await db.update(renderJobs).set({ status: "processing", workerId, progress: 0, startedAt: new Date() }).where(eq(renderJobs.id, next.job.id));
  const jobAssets = await db.select().from(assets).where(eq(assets.projectId, next.project.id)).orderBy(asc(assets.sortOrder));
  return { kind: "job" as const, job: { ...next.job, status: "processing" as const, workerId, progress: 0 }, project: next.project, assets: jobAssets };
}

export async function updateWorkerRenderJob(
  workerId: number,
  tokenHash: string,
  jobId: number,
  values: { status: "processing" | "review" | "completed" | "failed"; progress: number; outputKey?: string | null; outputUrl?: string | null; errorMessage?: string | null },
) {
  const db = await requireDb();
  const jobs = await db
    .select({ job: renderJobs, project: projects, worker: workers })
    .from(renderJobs)
    .innerJoin(projects, eq(renderJobs.projectId, projects.id))
    .innerJoin(workers, eq(workers.id, workerId))
    .where(and(eq(renderJobs.id, jobId), eq(workers.tokenHash, tokenHash), eq(projects.ownerId, workers.ownerId)))
    .limit(1);
  const record = jobs[0];
  if (!record) return undefined;
  if (record.job.workerId !== workerId && record.job.status !== "queued") return undefined;
  const now = new Date();
  const terminal = values.status === "completed" || values.status === "failed";
  await db.update(renderJobs).set({
    ...values,
    completedAt: terminal ? now : null,
    startedAt: values.status === "processing" ? now : record.job.startedAt,
  }).where(eq(renderJobs.id, jobId));
  if (values.status === "completed" && values.outputUrl) {
    await db.insert(exports).values({
      projectId: record.job.projectId,
      renderJobId: jobId,
      fileName: `framelab-export-${jobId}.${record.job.requestedFormat}`,
      storageKey: values.outputKey ?? null,
      storageUrl: values.outputUrl,
      mimeType: record.job.requestedFormat === "webm" ? "video/webm" : record.job.requestedFormat === "mov" ? "video/quicktime" : "video/mp4",
    }).onDuplicateKeyUpdate({
      set: { storageKey: values.outputKey ?? null, storageUrl: values.outputUrl },
    });
  }
  const updated = await db.select().from(renderJobs).where(eq(renderJobs.id, jobId)).limit(1);
  return updated[0];
}
