import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  aspectRatio: mysqlEnum("aspectRatio", ["9:16", "1:1", "4:5", "16:9"]).notNull().default("9:16"),
  canvasMode: mysqlEnum("canvasMode", ["fit", "fill"]).notNull().default("fit"),
  activePreset: varchar("activePreset", { length: 64 }).notNull().default("clean"),
  captionStyle: varchar("captionStyle", { length: 64 }).notNull().default("halo"),
  motionIntensity: int("motionIntensity").notNull().default(68),
  status: mysqlEnum("status", ["draft", "ready", "archived"]).notNull().default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("projects_owner_updated_idx").on(table.ownerId, table.updatedAt)]);

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  mediaKind: mysqlEnum("mediaKind", ["video", "audio", "image", "other"]).notNull().default("video"),
  storageKey: varchar("storageKey", { length: 1024 }),
  storageUrl: varchar("storageUrl", { length: 1200 }),
  mimeType: varchar("mimeType", { length: 160 }),
  byteSize: int("byteSize").notNull().default(0),
  durationMs: int("durationMs"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("assets_project_sort_idx").on(table.projectId, table.sortOrder)]);

export const transcriptTokens = mysqlTable("transcriptTokens", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  lineIndex: int("lineIndex").notNull(),
  tokenIndex: int("tokenIndex").notNull(),
  text: varchar("text", { length: 512 }).notNull(),
  startMs: int("startMs"),
  endMs: int("endMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("transcript_token_position_unique").on(table.projectId, table.lineIndex, table.tokenIndex),
  index("transcript_tokens_project_idx").on(table.projectId, table.lineIndex, table.tokenIndex),
]);

export const beatMarkers = mysqlTable("beatMarkers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  timestampMs: int("timestampMs").notNull(),
  strength: int("strength").notNull().default(50),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("beat_marker_project_timestamp_unique").on(table.projectId, table.timestampMs),
  index("beat_markers_project_idx").on(table.projectId, table.timestampMs),
]);

export const presets = mysqlTable("presets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId"),
  slug: varchar("slug", { length: 80 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  description: text("description"),
  configJson: json("configJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("preset_owner_slug_unique").on(table.ownerId, table.slug),
  index("presets_owner_updated_idx").on(table.ownerId, table.updatedAt),
]);

export const workers = mysqlTable("workers", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  mode: mysqlEnum("mode", ["pull"]).notNull().default("pull"),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull(),
  tokenHint: varchar("tokenHint", { length: 12 }).notNull(),
  lastSeenAt: timestamp("lastSeenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("workers_owner_idx").on(table.ownerId, table.updatedAt)]);

export const renderJobs = mysqlTable("renderJobs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  requestedFormat: mysqlEnum("requestedFormat", ["mp4", "webm", "mov"]).notNull().default("mp4"),
  planJson: json("planJson").notNull(),
  status: mysqlEnum("status", ["draft", "queued", "processing", "review", "completed", "failed"]).notNull().default("draft"),
  progress: int("progress").notNull().default(0),
  workerId: int("workerId"),
  outputKey: varchar("outputKey", { length: 1024 }),
  outputUrl: varchar("outputUrl", { length: 1200 }),
  errorMessage: text("errorMessage"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("render_jobs_project_updated_idx").on(table.projectId, table.updatedAt)]);

export const exports = mysqlTable("exports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  renderJobId: int("renderJobId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }),
  storageUrl: varchar("storageUrl", { length: 1200 }).notNull(),
  mimeType: varchar("mimeType", { length: 160 }).notNull().default("video/mp4"),
  byteSize: int("byteSize").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("exports_render_job_unique").on(table.renderJobId),
  index("exports_project_created_idx").on(table.projectId, table.createdAt),
]);

export type Project = typeof projects.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type TranscriptToken = typeof transcriptTokens.$inferSelect;
export type BeatMarker = typeof beatMarkers.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type RenderJob = typeof renderJobs.$inferSelect;
export type Preset = typeof presets.$inferSelect;
export type Export = typeof exports.$inferSelect;
