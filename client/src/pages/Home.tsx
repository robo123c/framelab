// Film Lab Console style: an original, responsive post-production workspace inspired by the supplied reference.
import { useEffect, useState } from "react";
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

const sources = [
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
  const [activeSource, setActiveSource] = useState(sources[0]);
  const [activePreset, setActivePreset] = useState("clean");
  const [ratio, setRatio] = useState("9:16");
  const [fitMode, setFitMode] = useState("Fit");
  const [textStyle, setTextStyle] = useState("Halo");
  const [isRendering, setIsRendering] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [projectName, setProjectName] = useState("MIDNIGHT RUN");

  useEffect(() => {
    window.localStorage.setItem("framelab-draft-04", JSON.stringify({ activeSource: activeSource.id, activePreset, ratio, fitMode, textStyle, projectName }));
  }, [activePreset, activeSource.id, fitMode, projectName, ratio, textStyle]);

  const chooseSource = (source: (typeof sources)[number]) => {
    setActiveSource(source);
    setRendered(false);
    toast.success(`${source.label} is now on the stage.`);
  };

  const generateCuts = () => {
    if (isRendering) return;
    setIsRendering(true);
    setRendered(false);
    toast.message("Sketching five cut directions…");
    window.setTimeout(() => {
      setIsRendering(false);
      setRendered(true);
      toast.success("Five cut directions are ready to review.");
    }, 1500);
  };

  const choosePreset = (presetId: string) => {
    setActivePreset(presetId);
    setRendered(false);
    const preset = presets.find((item) => item.id === presetId);
    toast.success(`${preset?.short} treatment applied.`);
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
        </nav>
        <div className="top-actions">
          <button type="button" className="credit-chip" onClick={() => toast.message("30 studio credits remain in this demo.")}>30 <Sparkles size={13} /></button>
          <button type="button" className="icon-button" aria-label="Notifications" onClick={() => toast.message("No new production notes.")}><Bell size={17} /></button>
          <button type="button" className="avatar-button" aria-label="Account menu" onClick={() => toast.message("Account menu is a frontend demo.")}>B</button>
        </div>
      </header>

      <section className="workspace" id="workspace">
        <aside className="source-rail" id="library">
          <div className="project-heading">
            <p className="eyebrow">PROJECT / 04</p>
            <button type="button" className="project-name" onClick={() => setProjectName(projectName === "MIDNIGHT RUN" ? "NEON DEPARTURE" : "MIDNIGHT RUN")}>
              {projectName}<ChevronDown size={15} />
            </button>
          </div>

          <div className="source-actions">
            <button type="button" className="source-action" onClick={() => toast.message("Paste a public video URL to connect a remote source.")}><FileVideo2 size={15} /> Import URL</button>
            <label className="source-action source-upload">
              <Upload size={15} /> Upload source
              <input type="file" accept="video/*" onChange={() => toast.success("Source received. It will appear in your local library.")} />
            </label>
          </div>

          <div className="library-head">
            <div><p className="eyebrow">SOURCE TRAY</p><span>03 selected</span></div>
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
              {["9:16", "1:1", "4:5", "16:9"].map((option) => <button type="button" key={option} className={ratio === option ? "is-selected" : ""} onClick={() => { setRatio(option); setRendered(false); }}>{option}</button>)}
            </div>
            <div className="fit-toggle">
              {["Fit", "Fill"].map((option) => <button type="button" key={option} className={fitMode === option ? "is-selected" : ""} onClick={() => { setFitMode(option); toast.message(`${option} crop mode selected.`); }}>{option}</button>)}
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
              {textStyles.map((style) => <button type="button" key={style} className={textStyle === style ? "is-selected" : ""} onClick={() => { setTextStyle(style); setRendered(false); }}>{style === "None" ? <X size={15} /> : style.slice(0, 1)}</button>)}
            </div>
            <label className="intensity-label">Motion intensity <span>68</span><input type="range" min="0" max="100" defaultValue="68" onChange={() => setRendered(false)} /></label>
          </section>

          <section className="output-card" id="output">
            <div className="output-copy"><span className="eyebrow">OUTPUT SLOT</span><strong>{rendered ? "DRAFT 04 ARMED" : "WAITING FOR CUTS"}</strong><span className="output-wave" aria-hidden="true"><i /><i /><i /></span></div>
            <button type="button" className={rendered ? "output-ready" : ""} onClick={() => rendered ? toast.success("Export settings opened. Your draft is ready for review.") : toast.message("Generate cuts before opening export.")}>{rendered ? <Check size={16} /> : <ImagePlus size={16} />}</button>
          </section>
        </aside>
      </section>

      <footer className="workspace-footer"><span>FrameLab / Open Source UI Study</span><span><Clapperboard size={14} /> Original frontend prototype</span><span>v0.1</span></footer>
    </main>
  );
}
