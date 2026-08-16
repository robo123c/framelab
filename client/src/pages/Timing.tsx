// Film Lab Console style: a browser-local lyrics and beat-timing surface modeled as compact cut-room instrumentation.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clapperboard, Eraser, FileDown, Library, Minus, Play, Plus, Sparkles, Volume2, X } from "lucide-react";
import { toast } from "sonner";

const initialLines = [
  ["I", "move", "past", "the", "noise", "when", "the", "night", "gets", "loud"],
  ["No", "map", "but", "I", "still", "know", "where", "I", "am", "going"],
  ["Frame", "the", "moment", "then", "let", "the", "cut", "breathe"],
  ["Hold", "the", "light", "until", "the", "beat", "comes", "back"],
];

export default function Timing() {
  const [duration, setDuration] = useState(15);
  const [lines, setLines] = useState(initialLines);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [lyricsConfirmed, setLyricsConfirmed] = useState(false);
  const [beats, setBeats] = useState<boolean[]>(() => Array.from({ length: 20 }, (_, index) => index % 2 === 0 || index === 7 || index === 13));
  const [beatsConfirmed, setBeatsConfirmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const beatCount = useMemo(() => beats.filter(Boolean).length, [beats]);

  const addBeat = () => {
    setBeats((current) => { const next = [...current]; const target = next.findIndex((value) => !value); if (target >= 0) next[target] = true; return next; });
    setBeatsConfirmed(false);
  };

  const removeBeat = () => {
    setBeats((current) => { const next = [...current]; const target = next.lastIndexOf(true); if (target >= 0) next[target] = false; return next; });
    setBeatsConfirmed(false);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key.toLowerCase() === "m" && !event.metaKey && !event.ctrlKey) addBeat(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const addWord = (lineIndex: number) => {
    setLines((current) => current.map((line, index) => index === lineIndex ? [...line, "new"] : line));
    setLyricsConfirmed(false);
  };

  return (
    <main className="timing-shell">
      <div className="ambient-field" aria-hidden="true" />
      <header className="top-rail"><a className="brand-lockup" href="/dashboard"><img src="/manus-storage/framelab-mark_27a43cfa.png" alt="" className="brand-mark" /><span>FRAME<span>LAB</span></span></a><nav className="top-nav"><a href="/dashboard">DASHBOARD</a><a href="/project/draft-04/preview">WORKSPACE</a><a className="is-current" href="/project/draft-04/song">TIMING</a></nav><div className="top-actions"><button type="button" className="credit-chip"><Sparkles size={13} /> FREE</button><button type="button" className="avatar-button">B</button></div></header>
      <section className="timing-main"><div className="timing-heading"><div><a href="/project/draft-04/preview" className="back-link"><ArrowLeft size={14} /> Back to editor</a><p className="eyebrow">DRAFT 04 / TIMING PASS</p><h1>MIDNIGHT RUN</h1></div><div className="timing-ready"><span className={lyricsConfirmed && beatsConfirmed ? "ready-dot" : "ready-dot is-muted"} /><span>{lyricsConfirmed && beatsConfirmed ? "TIMING CONFIRMED" : "TIMING IN PROGRESS"}</span></div></div>
        <div className="timing-grid">
          <section className="timing-panel audio-panel"><div className="panel-index">01</div><div><p className="eyebrow">AUDIO REFERENCE</p><h2>Snippet window</h2></div><button type="button" className="audio-orb" onClick={() => setPlaying(!playing)}>{playing ? <X size={18} /> : <Play size={18} fill="currentColor" />}</button><div className={`audio-waves ${playing ? "is-playing" : ""}`}><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="duration-options">{[15, 20, 25, 30].map((option) => <button type="button" key={option} className={duration === option ? "is-selected" : ""} onClick={() => { setDuration(option); toast.message(`${option}-second local timing window selected.`); }}>{option}s</button>)}</div><div className="audio-status"><Volume2 size={15} /><span>{duration}.0s selected</span><strong>{playing ? "PLAYING" : "READY"}</strong></div><p className="audio-note">A browser-local timing surface. Connect your own audio pipeline when you self-host.</p></section>
          <section className="timing-panel lyrics-panel"><div className="panel-index">02</div><div className="panel-heading"><div><p className="eyebrow">LYRICS / TOKENS</p><h2>Shape the language.</h2></div><span>{lyricsConfirmed ? "locked" : "editable"}</span></div><p className="panel-note">Click a word to mark it. Double-click to recut the cadence.</p><div className="lyrics-lines">{lines.map((line, lineIndex) => <div className="lyric-line" key={`line-${lineIndex}`}><span>{String(lineIndex + 1).padStart(2, "0")}</span><div>{line.map((word, wordIndex) => <button type="button" key={`${word}-${wordIndex}`} className={selectedToken === `${lineIndex}-${wordIndex}` ? "is-selected" : ""} onClick={() => setSelectedToken(`${lineIndex}-${wordIndex}`)} onDoubleClick={() => toast.message(`“${word}” is ready for local editing.`)}>{word}</button>)}<button type="button" className="add-word" onClick={() => addWord(lineIndex)}><Plus size={12} /></button></div></div>)}</div><div className="timing-actions"><button type="button" onClick={() => { setLines((current) => [...current, ["New", "timing", "line"]]); setLyricsConfirmed(false); }}><Plus size={14} /> Add line</button><button type="button" onClick={() => toast.message("Import is reserved for self-hosted transcript sources.")}><FileDown size={14} /> Import</button><button type="button" className={lyricsConfirmed ? "is-confirmed" : ""} onClick={() => { setLyricsConfirmed(true); toast.success("Lyric timing confirmed locally."); }}><Check size={14} /> {lyricsConfirmed ? "Confirmed" : "Confirm lyrics"}</button></div></section>
          <section className="timing-panel beats-panel"><div className="panel-index">03</div><div className="panel-heading"><div><p className="eyebrow">BEAT MARKERS</p><h2>Mark the cuts.</h2></div><span>{beatCount} markers</span></div><p className="panel-note">Press <kbd>M</kbd> to add a beat while this page is active.</p><div className="beat-grid" aria-label="Beat marker grid">{beats.map((active, index) => <button type="button" key={index} className={active ? "is-active" : ""} onClick={() => { setBeats((current) => current.map((value, item) => item === index ? !value : value)); setBeatsConfirmed(false); }}><i /><span>{String(index + 1).padStart(2, "0")}</span></button>)}</div><div className="beat-mini-timeline"><span /><span /><span /><span /><span /><span /></div><div className="timing-actions beat-actions"><button type="button" onClick={addBeat}><Plus size={14} /> Add marker</button><button type="button" onClick={removeBeat}><Minus size={14} /> Remove</button><button type="button" onClick={() => { setBeats(beats.map(() => false)); setBeatsConfirmed(false); }}><Eraser size={14} /> Clear</button><button type="button" className={beatsConfirmed ? "is-confirmed" : ""} onClick={() => { setBeatsConfirmed(true); toast.success("Beat map confirmed locally."); }}><Check size={14} /> {beatsConfirmed ? "Confirmed" : "Confirm beats"}</button></div></section>
        </div>
      </section>
      <footer className="workspace-footer"><span>FrameLab / Timing pass</span><span><Clapperboard size={14} /> {beatCount} local beat markers</span><span><a href="https://github.com/robo123c/framelab" target="_blank" rel="noreferrer">Open source</a></span></footer>
    </main>
  );
}
