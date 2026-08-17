// Film Lab Console style: a technical, deployment-aware control surface for optional self-hosted processing workers.
import { useState } from "react";
import { Check, Copy, Cpu, KeyRound, Loader2, Plus, Radio, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Workers() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [label, setLabel] = useState("Studio worker");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const workersQuery = trpc.worker.list.useQuery(undefined, { enabled: isAuthenticated });
  const registerMutation = trpc.worker.register.useMutation({
    onSuccess: async (result) => {
      setIssuedToken(result.token);
      await utils.worker.list.invalidate();
      toast.success(`${result.worker.label} is registered. Copy the token once.`);
    },
  });

  const register = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    registerMutation.mutate({ label });
  };

  const copy = async () => {
    if (!issuedToken) return;
    await navigator.clipboard.writeText(issuedToken);
    toast.success("Worker token copied. It will not be shown again after you leave this page.");
  };

  return (
    <main className="workers-shell">
      <div className="ambient-field" aria-hidden="true" />
      <header className="top-rail"><a className="brand-lockup" href="/dashboard"><img src="/manus-storage/framelab-mark_27a43cfa.png" alt="" className="brand-mark" /><span>FRAME<span>LAB</span></span></a><nav className="top-nav"><a href="/dashboard">DASHBOARD</a><a href="/project/draft-04/preview">WORKSPACE</a><a className="is-current" href="/workers">WORKERS</a></nav><div className="top-actions"><button type="button" className="credit-chip"><Cpu size={13} /> OPTIONAL</button><button type="button" className="avatar-button" onClick={() => isAuthenticated ? toast.message(`Signed in as ${user?.name ?? "FrameLab creator"}.`) : startLogin()}>{user?.name?.slice(0, 1).toUpperCase() ?? "B"}</button></div></header>
      <section className="workers-main"><div className="workers-heading"><div><p className="eyebrow">SELF-HOSTED PROCESSING</p><h1>Bring your own<br /><em>render engine.</em></h1></div><p>Workers pull only the queued jobs you authorize, process media on infrastructure you control, and report a verifiable job state back to FrameLab.</p></div>
        <div className="workers-grid"><section className="worker-panel register-panel"><div className="worker-panel-head"><div><p className="eyebrow">01 / REGISTER</p><h2>Issue a worker key.</h2></div><KeyRound size={19} /></div><p className="worker-copy">A worker token is created once, stored as a hash, and shown below only after registration. Keep it out of public repositories.</p><label className="worker-label">Worker label<input value={label} maxLength={120} onChange={(event) => setLabel(event.target.value)} placeholder="Studio worker" /></label><button type="button" className="worker-primary" onClick={register} disabled={registerMutation.isPending || !label.trim()}>{registerMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}{isAuthenticated ? "Register worker" : "Sign in to register"}</button>{issuedToken && <div className="token-card"><span><ShieldCheck size={14} /> Copy this token now</span><code>{issuedToken}</code><button type="button" onClick={copy}><Copy size={14} /> Copy token</button></div>}</section>
          <section className="worker-panel fleet-panel"><div className="worker-panel-head"><div><p className="eyebrow">02 / FLEET</p><h2>Authorized workers.</h2></div><Radio size={19} /></div>{!isAuthenticated ? <div className="worker-empty">Sign in to see your worker fleet.</div> : workersQuery.isLoading ? <div className="worker-empty"><Loader2 className="animate-spin" size={17} /> Loading registrations…</div> : workersQuery.data?.length ? <div className="worker-list">{workersQuery.data.map((worker) => <div className="worker-row" key={worker.id}><span className={worker.lastSeenAt ? "worker-dot is-live" : "worker-dot"} /><div><strong>{worker.label}</strong><small>pull mode · token ends {worker.tokenHint}</small></div><span>{worker.lastSeenAt ? `seen ${new Date(worker.lastSeenAt).toLocaleString()}` : "not connected"}</span></div>)}</div> : <div className="worker-empty"><Cpu size={17} /> No worker registered yet. Local planning and project persistence still work without one.</div>}</section>
          <section className="worker-panel protocol-panel"><div className="worker-panel-head"><div><p className="eyebrow">03 / PROTOCOL</p><h2>Pull, process, report.</h2></div><Check size={19} /></div><ol><li><b>Claim</b><span>The worker requests the next queued job using its numeric identifier and one-time-issued token.</span></li><li><b>Process</b><span>The worker downloads only the job’s authorized assets and executes its operator-configured render command.</span></li><li><b>Report</b><span>It posts progress, then returns either a review-ready artifact location or a clear failure message.</span></li></ol><a href="https://github.com/robo123c/framelab/tree/main/worker" target="_blank" rel="noreferrer">Open the self-hosted worker starter <Copy size={13} /></a></section>
        </div></section>
      <footer className="workspace-footer"><span>FrameLab / Worker control</span><span><Cpu size={14} /> Operator-owned processing</span><span>MIT</span></footer>
    </main>
  );
}
