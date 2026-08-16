// Film Lab Console style: a free local project dashboard with the same compact, cinematic workbench language as the editor.
import { useEffect, useState } from "react";
import { ArrowUpRight, Clapperboard, Library, Plus, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const modes = [
  { title: "CUT", subtitle: "Assembly mode", description: "Pick footage, shape captions, and stage a vertical cut.", className: "mode-cut" },
  { title: "PROMPT", subtitle: "Local draft mode", description: "Start from a short treatment and build a structured edit plan.", className: "mode-prompt" },
  { title: "TIMING", subtitle: "Lyrics & beats", description: "Edit transcript tokens and prepare beat markers for the cut.", className: "mode-timing" },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [projects, setProjects] = useState<string[]>(["MIDNIGHT RUN"]);

  useEffect(() => {
    const saved = window.localStorage.getItem("framelab-projects");
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  const createProject = () => {
    const next = `UNTITLED TAKE ${String(projects.length + 1).padStart(2, "0")}`;
    const updated = [...projects, next];
    setProjects(updated);
    window.localStorage.setItem("framelab-projects", JSON.stringify(updated));
    toast.success(`${next} opened as a browser-local draft.`);
    navigate("/project/draft-04/preview");
  };

  return (
    <main className="dashboard-shell">
      <div className="ambient-field" aria-hidden="true" />
      <header className="top-rail">
        <a className="brand-lockup" href="/dashboard" aria-label="FrameLab dashboard"><img src="/manus-storage/framelab-mark_27a43cfa.png" alt="" className="brand-mark" /><span>FRAME<span>LAB</span></span></a>
        <nav className="top-nav" aria-label="Primary navigation"><a className="is-current" href="/dashboard">DASHBOARD</a><a href="/project/draft-04/preview">WORKSPACE</a><a href="#projects">PROJECTS</a></nav>
        <div className="top-actions"><button type="button" className="credit-chip" onClick={() => toast.message("FrameLab is free in local demo mode.")}><Sparkles size={13} /> FREE</button><button type="button" className="avatar-button" onClick={() => toast.message("No account required — drafts live in this browser.")}>B</button></div>
      </header>

      <section className="dashboard-main">
        <div className="dashboard-intro"><div><p className="eyebrow">WORKSTATION LOBBY / LOCAL MODE</p><h1>Every cut starts<br /><em>with a decision.</em></h1></div><div className="dashboard-status"><p>FrameLab keeps local drafts, treatment decisions, lyric timing, and cut states in one browser-native workbench.</p><div className="dashboard-readouts"><span><i>01</i> active draft</span><span><i>15s</i> timing window</span><span><i>local</i> render plan</span></div></div></div>
        <div className="mode-row" aria-label="Creation modes">
          {modes.map((mode, index) => {
            return <button type="button" key={mode.title} className={`mode-card ${mode.className}`} onClick={() => mode.title === "TIMING" ? navigate("/project/draft-04/song") : navigate("/project/draft-04/preview")}><div className="mode-card-art"><span className="mode-bracket" aria-hidden="true"><b>0{index + 1}</b><i /><i /><i /><b>FL</b></span><span className="mode-grain" /></div><div className="mode-card-copy"><span>{mode.subtitle}</span><strong>{mode.title}</strong><p>{mode.description}</p><i><ArrowUpRight size={15} /></i></div></button>;
          })}
          <button type="button" className="mode-card mode-locked" onClick={() => toast.message("Automation and visualizer modes are planned as self-hosted extensions.")}><div className="mode-card-art"><span className="mode-bracket" aria-hidden="true"><b>04</b><i /><i /><i /><b>+</b></span></div><div className="mode-card-copy"><span>Self-host extension</span><strong>MORE MODES</strong><p>Bring your own render or analysis engine.</p><i><ArrowUpRight size={15} /></i></div></button>
        </div>

        <section className="projects-section" id="projects"><div className="section-heading"><div><p className="eyebrow">PROJECT SHELF</p><h2>Local drafts</h2></div><button type="button" onClick={createProject}><Plus size={16} /> New project</button></div><div className="project-grid">
          {projects.map((project, index) => <button type="button" key={`${project}-${index}`} className="project-card" onClick={() => navigate("/project/draft-04/preview")}><div className="project-thumb"><span className="project-frame" /><span className="project-index">0{index + 1}</span><span className="project-wave"><i /><i /><i /></span></div><div className="project-meta"><div><span>Draft / 04</span><strong>{project}</strong></div><ArrowUpRight size={15} /></div></button>)}
          <button type="button" className="new-project-card" onClick={createProject}><Plus size={28} /><span>Start a local draft</span><small>No login. No credits.</small></button>
        </div></section>
      </section>
      <footer className="workspace-footer"><span>FrameLab / Free local edition</span><span><Library size={14} /> Browser-local drafts</span><span><a href="https://github.com/robo123c/framelab" target="_blank" rel="noreferrer">Source</a></span></footer>
    </main>
  );
}
