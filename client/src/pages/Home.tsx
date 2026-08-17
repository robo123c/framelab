// Film Lab Console style: an original, responsive post-production workspace inspired by the supplied reference.
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Bell,
  Check,
  ChevronDown,
  Clapperboard,
  FileVideo2,
  FolderOpen,
  ImagePlus,
  LayoutGrid,
  Maximize2,
  MoreHorizontal,
  Play,
  Plus,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRoute } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

type StageSource = { id: string; label: string; type: string; image: string };

const demoSources: StageSource[] = [
  { id: "court", label: "COURTSIDE", type: "archive", image: "/manus-storage/framelab-preview-court_68e052c6.jpg" },
  { id: "night", label: "NIGHT SIGNAL", type: "scene", image: "/manus-storage/framelab-preview-night_ebbbb86e.jpg" },
  { id: "land", label: "SALTLINE", type: "scene", image: "/manus-storage/framelab-preview-landscape_e62e6a0c.jpg" },
];

const presets = [
  { id: "clean", short: "Clean", detail: "Quiet cuts and grounded captions", tone: "from-emerald-300/65 via-emerald-950 to-black" },
  { id: "pulse", short: "Pulse", detail: "Beat flashes and slung type", tone: "from-rose-400/70 via-rose-950 to-black" },
  { id: "chrome", short: "Chrome", detail: "Metallic title card energy", tone: "from-stone-300/75 via-slate-700 to-black" },
  { id: "ghost", short: "Ghost", detail: "Stretched shadows and echo", tone: "from-violet-400/60 via-violet-950 to-black" },
];

const textStyles = ["None", "Halo", "Ink", "Mono", "Narrow"];

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const { user, isAuthenticated } = useAuth();
  const [, routeParams] = useRoute("/project/:id/preview");
  const projectId = Number(routeParams?.id);
  const persistentProject = Boolean(isAuthenticated && Number.isInteger(projectId) && projectId > 0);
  const utils = trpc.useUtils();
  const workspaceQuery = trpc.project.workspace.useQuery({ projectId }, { enabled: persistentProject });
  const updateProjectMutation = trpc.project.update.useMutation({ onSuccess: () => persistentProject && utils.project.workspace.invalidate({ projectId }) });
  const uploadAssetMutation = trpc.asset.upload.useMutation({ onSuccess: async () => { await utils.project.workspace.invalidate({ projectId }); toast.success("Asset is stored in your project library."); } });
  const queueRenderMutation = trpc.render.queue.useMutation({ onSuccess: async () => { await utils.project.workspace.invalidate({ projectId }); toast.success("Render plan queued for an optional worker."); } });

  const [activeSource, setActiveSource] = useState(demoSources[0]);
  const [activePreset, setActivePreset] = useState("clean");
  const [ratio, setRatio] = useState("9:16");
  const [fitMode, setFitMode] = useState("Fit");
  const [textStyle, setTextStyle] = useState("Halo");
  const [isRendering, setIsRendering] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [projectName, setProjectName] = useState("MIDNIGHT RUN");

  const sources = useMemo<StageSource[]>(() => [
    ...demoSources,
    ...(workspaceQuery.data?.assets ?? []).map((asset) => ({
      id: `asset-${asset.id}`,
      label: asset.displayName.slice(0, 20).toUpperCase(),
      type: asset.mediaKind,
      image: asset.mediaKind === "image" && asset.storageUrl ? asset.storageUrl : "/manus-storage/framelab-preview-night_ebbbb86e.jpg",
    })),
  ], [workspaceQuery.data?.assets]);

  useEffect(() => {
    window.localStorage.setItem("framelab-draft-04", JSON.stringify({ activeSource: activeSource.id, activePreset, ratio, fitMode, textStyle, projectName }));
  }, [activePreset, activeSource.id, fitMode, projectName, ratio, textStyle]);

  useEffect(() => {
    const project = workspaceQuery.data?.project;
    if (!project) return;
    setProjectName(project.name);
    setRatio(project.aspectRatio);
    setFitMode(project.canvasMode === "fill" ? "Fill" : "Fit");
    setActivePreset(project.activePreset);
    setTextStyle(project.captionStyle);
  }, [workspaceQuery.data?.project]);

  const saveProject = (values: {
    name?: string;
    aspectRatio?: "9:16" | "1:1" | "4:5" | "16:9";
    canvasMode?: "fit" | "fill";
    activePreset?: string;
    captionStyle?: string;
    motionIntensity?: number;
  }) => {
    if (persistentProject) updateProjectMutation.mutate({ projectId, ...values });
  };

  const chooseSource = (source: StageSource) => {
    setActiveSource(source);
    setRendered(false);
    toast.success(`${source.label} is now on the stage.`);
  };

  const generateCuts = () => {
    if (isRendering) return;
    setIsRendering(true);
    setRendered(false);
    toast.message(persistentProject ? "Preparing a persistent render plan…" : "Sketching five cut directions…");
    if (persistentProject) {
      queueRenderMutation.mutate({
        projectId,
        requestedFormat: "mp4",
        plan: { source: activeSource.id, aspectRatio: ratio, canvasMode: fitMode.toLowerCase(), preset: activePreset, captionStyle: textStyle, motionIntensity: 68 },
      }, {
        onSettled: () => { setIsRendering(false); setRendered(true); },
      });
      return;
    }
    window.setTimeout(() => {
      setIsRendering(false);
      setRendered(true);
      toast.success("Five cut directions are ready to review.");
    }, 1500);
  };

  const choosePreset = (presetId: string) => {
    setActivePreset(presetId);
    setRendered(false);
    saveProject({ activePreset: presetId });
    const preset = presets.find((item) => item.id === presetId);
    toast.success(`${preset?.short} treatment applied.`);
  };

  const uploadAsset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!persistentProject) {
      toast.message("Sign in and open a persistent project to save uploads.");
      startLogin();
      return;
    }
    if (file.size > 15_000_000) {
      toast.error("Uploads are limited to 15 MB in the integrated app.");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    uploadAssetMutation.mutate({
      projectId,
      fileName: file.name,
      mediaKind: file.type.startsWith("audio/") ? "audio" : file.type.startsWith("image/") ? "image" : "video",
      mimeType: file.type || "application/octet-stream",
      base64: btoa(binary),
      byteSize: file.size,
      sortOrder: sources.length,
    });
  };

  return (
    <main className="app-shell">
      <div className="ambient-field" aria-hidden="true" />
      <header className="top-rail">
        <a className="brand-lockup" href="#workspace" aria-label="FrameLab workspace">
          <img src="/manus-storage/framelab-mark_27a43cfa.png" alt="" className="brand-mark" />
          <span>FRAME<span>LAB</span></span>
        </a>
        <nav className="top-nav" aria-label="Primary navigation">
          <a href="/dashboard">DASHBOARD</a>
          <a href="#library">LIBRARY</a>
          <a href="/project/draft-04/song">TIMING</a>
          <a href="/workers">WORKERS</a>
        </nav>
        <div className="top-actions">
          <button type="button" className="credit-chip" onClick={() => toast.message(persistentProject ? "Persistent workspace active. Processing remains worker-controlled." : "FrameLab is free in browser-local mode.")}>{persistentProject ? "SYNC" : "FREE"} <Sparkles size={13} /></button>
          <button type="button" className="icon-button" aria-label="Notifications" onClick={() => toast.message("No new production notes.")}><Bell size={17} /></button>
          <button type="button" className="avatar-button" aria-label="Account menu" onClick={() => toast.message(user ? `Signed in as ${user.name ?? "FrameLab creator"}.` : "Sign in to save projects across devices.")}>{user?.name?.slice(0, 1).toUpperCase() ?? "B"}</button>
        </div>
      </header>

      <section className="workspace" id="workspace">
        <aside className="source-rail" id="library">
          <div className="project-heading">
            <p className="eyebrow">{persistentProject ? `PROJECT / ${String(projectId).padStart(2, "0")}` : "PROJECT / LOCAL"}</p>
            <button type="button" className="project-name" onClick={() => { const next = projectName === "MIDNIGHT RUN" ? "NEON DEPARTURE" : "MIDNIGHT RUN"; setProjectName(next); saveProject({ name: next }); }}>
              {projectName}<ChevronDown size={15} />
            </button>
          </div>

          <div className="source-actions">
            <button type="button" className="source-action" onClick={() => toast.message("Paste a public video URL to connect a remote source.")}><FileVideo2 size={15} /> Import URL</button>
            <label className="source-action source-upload">
              <Upload size={15} /> Upload source
              <input type="file" accept="video/*,audio/*,image/*" onChange={uploadAsset} />
            </label>
          </div>

          <div className="library-head">
            <div><p className="eyebrow">SOURCE TRAY</p><span>{String(sources.length).padStart(2, "0")} selected</span></div>
            <button type="button" onClick={() => toast.message("The source tray has been cleared in this demo.")}>Clear</button>
          </div>

          <div className="source-list" aria-label="Available footage">
            {sources.map((source, index) => (
              <button
                type="button"
                key={source.id}
                onClick={() => chooseSource(source)}
                className={`source-card ${activeSource.id === source.id ? "is-active" : ""}`}
                aria-pressed={activeSource.id === source.id}
              >
                <img src={source.image} alt="" />
                <span className="source-card-shade" />
                <span className="source-index">0{index + 1}</span>
                <span className="source-card-meta"><strong>{source.label}</strong><small>{source.type}</small></span>
                {activeSource.id === source.id && <span className="source-selected"><Check size={13} /></span>}
              </button>
            ))}
          </div>
          <button type="button" className="more-sources" onClick={() => toast.message("The complete source library is a planned integration.")}><FolderOpen size={15} /> View source library <MoreHorizontal size={15} /></button>

          <button type="button" className={`generate-button ${isRendering ? "is-rendering" : ""}`} onClick={generateCuts} disabled={isRendering}>
            <WandSparkles size={17} />
            <span>{isRendering ? "ASSEMBLING CUTS" : "GENERATE 5 CUTS"}</span>
            <kbd>G</kbd>
          </button>
          <div className={`status-strip ${rendered ? "is-ready" : ""}`}>
            <span className="status-light" />
            <span className="status-wave" aria-hidden="true"><i /><i /><i /></span>
            {isRendering ? "IN MOTION" : rendered ? "CUTS READY" : "STAGE READY"}
          </div>
        </aside>

        <section className="stage" aria-label="Project preview">
          <div className="stage-topline">
            <a className="crumb" href="/dashboard"><LayoutGrid size={14} /> Studio / Draft 04</a>
            <div className="stage-tools">
              <a className="timing-link" href="/project/draft-04/song"><SlidersHorizontal size={14} /> Lyrics & beats</a>
              <button type="button" onClick={() => toast.message("Preview controls are available after generating a cut.")}><Play size={14} /> Preview</button>
              <button type="button" aria-label="Stage settings" onClick={() => toast.message("Stage settings are a frontend demo.")}><Settings2 size={16} /></button>
            </div>
          </div>

          <div className={`preview-wrap ratio-${ratio.replace(":", "-")}`}>
            <div className="preview-frame">
              <img src={activeSource.image} alt="Selected footage preview" />
              <div className="preview-gradient" />
              <div className="frame-code">FRM—{activeSource.id.toUpperCase()} / 00:18</div>
              <div className="frame-signature" aria-label="FrameLab timing signature"><span /><i /><i /><i /><span /></div>
              <div className="caption-preview"><span>MOVE</span><strong>WITHOUT ASKING.</strong></div>
              <button type="button" className="preview-play" aria-label="Play preview" onClick={() => toast.message("Preview playback will be available when a media pipeline is connected.")}><Play size={19} fill="currentColor" /></button>
              <div className="safe-corners" aria-hidden="true"><i /><i /><i /><i /></div>
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-meta"><span>00:00</span><span>00:24</span></div>
            <div className="wave-track" aria-label="Demo timeline"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
            <div className="timeline-playhead" />
            <div className="timeline-clips"><span /><span /><span /></div>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-heading">
            <div><p className="eyebrow">CUT PARAMETERS</p><h1>Shape the cut.</h1></div>
            <button type="button" aria-label="Close inspector" onClick={() => toast.message("The inspector stays open in this demo.")}><X size={17} /></button>
          </div>

          <section className="control-section">
            <div className="control-title"><span>Canvas</span><small>Output</small></div>
            <div className="ratio-grid">
              {["9:16", "1:1", "4:5", "16:9"].map((option) => <button type="button" key={option} className={ratio === option ? "is-selected" : ""} onClick={() => { setRatio(option); setRendered(false); saveProject({ aspectRatio: option as "9:16" | "1:1" | "4:5" | "16:9" }); }}>{option}</button>)}
            </div>
            <div className="fit-toggle">
              {["Fit", "Fill"].map((option) => <button type="button" key={option} className={fitMode === option ? "is-selected" : ""} onClick={() => { setFitMode(option); saveProject({ canvasMode: option.toLowerCase() as "fit" | "fill" }); toast.message(`${option} crop mode selected.`); }}>{option}</button>)}
            </div>
          </section>

          <section className="control-section">
            <div className="control-title"><span>Treatment</span><small>Look</small></div>
            <div className="preset-stack">
              {presets.map((preset) => <button type="button" key={preset.id} className={`preset-card ${activePreset === preset.id ? "is-selected" : ""}`} onClick={() => choosePreset(preset.id)}>
                <span className={`preset-swatch bg-gradient-to-br ${preset.tone}`} />
                <span><strong>{preset.short}</strong><small>{preset.detail}</small></span>
                {activePreset === preset.id && <Check size={14} />}
              </button>)}
            </div>
          </section>

          <section className="control-section">
            <div className="control-title"><span>Caption system</span><small>{textStyle}</small></div>
            <div className="text-style-row">
              {textStyles.map((style) => <button type="button" key={style} className={textStyle === style ? "is-selected" : ""} onClick={() => { setTextStyle(style); setRendered(false); saveProject({ captionStyle: style.toLowerCase() }); }}>{style === "None" ? <X size={15} /> : style.slice(0, 1)}</button>)}
            </div>
            <label className="intensity-label">Motion intensity <span>68</span><input type="range" min="0" max="100" defaultValue="68" onChange={() => setRendered(false)} /></label>
          </section>

          <section className="output-card" id="output">
            <div className="output-copy"><span className="eyebrow">OUTPUT SLOT</span><strong>{workspaceQuery.data?.jobs?.[0] ? workspaceQuery.data.jobs[0].status.toUpperCase() : rendered ? "DRAFT ARMED" : "WAITING FOR CUTS"}</strong><span className="output-wave" aria-hidden="true"><i /><i /><i /></span></div>
            <button type="button" className={rendered ? "output-ready" : ""} onClick={() => { const exportUrl = workspaceQuery.data?.exports?.[0]?.storageUrl ?? workspaceQuery.data?.jobs?.[0]?.outputUrl; if (exportUrl) window.open(exportUrl, "_blank", "noopener,noreferrer"); else if (workspaceQuery.data?.jobs?.[0]) toast.message(`Latest job is ${workspaceQuery.data.jobs[0].status}. Your worker will attach an export when it completes.`); else if (rendered) toast.success("Export settings opened. Your draft is ready for review."); else toast.message("Generate cuts before opening export."); }}>{workspaceQuery.data?.exports?.[0]?.storageUrl || workspaceQuery.data?.jobs?.[0]?.outputUrl || rendered ? <Check size={16} /> : <ImagePlus size={16} />}</button>
          </section>
        </aside>
      </section>

      <footer className="workspace-footer"><span>FrameLab / Open Source UI Study</span><span><Clapperboard size={14} /> Original frontend prototype</span><span>v0.1</span></footer>
    </main>
  );
}
