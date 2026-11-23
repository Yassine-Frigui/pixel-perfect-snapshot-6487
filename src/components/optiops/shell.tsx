import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Activity, Boxes, ChartNoAxesCombined, ChevronDown, ChevronRight, ChevronsUpDown, CircleHelp, Command, Cpu, FlaskConical, GitBranch, Menu, PanelLeftClose, ShieldCheck, Bell, ArrowLeftRight, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { api, type Container } from '@/services/api';
import data from '@/mock/data.json';

type Context = { containers: Container[]; selected: string; select: (id: string) => void; refresh: () => Promise<void>; mock: boolean; range: string; setRange: (range: string) => void; };
const CockpitContext = createContext<Context | undefined>(undefined);
export function useCockpit() { const context = useContext(CockpitContext); if (!context) throw new Error('Cockpit provider missing'); return context; }
export function useContainer() { const { containers, selected } = useCockpit(); const c = containers.find(c => c.id === selected) ?? containers[0]; if (!c) throw new Error('No containers'); return c; }
const navigation = [
  { path: '/', label: 'Live telemetry', icon: Activity, section: 'Telemetry' },
  { path: '/server-fitting', label: 'Server fitting', icon: FlaskConical, section: 'Server fitting' },
  { path: '/crash-forecast', label: 'Time-to-crash', icon: ChartNoAxesCombined, section: 'Time-to-crash' },
  { path: '/finops', label: 'FinOps & GitOps', icon: GitBranch, section: 'FinOps & GitOps' },
  { path: '/safety', label: 'Circuit breakers', icon: ShieldCheck, section: 'Circuit breakers' },
] as const;
export function CockpitShell({ children }: { children: ReactNode }) {
  const [containers, setContainers] = useState<Container[]>(data.containers);
  const [selected, select] = useState('payment-service');
  const [mock, setMock] = useState(true);
  const [range, setRange] = useState('Last 15m');
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: state => state.location.pathname });
  const active = navigation.find(n=>n.path===pathname) ?? navigation[0];
  async function refresh() { setContainers(await api.getContainers()); }
  useEffect(() => {
    const off = api.onModeChange(mode => { setMock(mode); void refresh(); });
    const offTelemetry = api.onTelemetry(event => setContainers(prev=>prev.map(c=>c.id===event.id ? {...c,...event} : c)));
    const stop = api.start();
    return () => { off(); offTelemetry(); stop(); };
  }, []);
  useEffect(()=>setOpen(false),[pathname]);
  return <CockpitContext.Provider value={{ containers, selected, select, refresh, mock, range, setRange }}>
    <div className="app-shell">
      {open && <div className="fixed inset-0 z-40 bg-background/80" onClick={()=>setOpen(false)} />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand"><Zap className="brand-mark" fill="currentColor" strokeWidth={1.2} /><span>OptiOps</span><small>BETA</small>{open && <Button size="icon" variant="ghost" aria-label="Close navigation" onClick={()=>setOpen(false)}><X /></Button>}</div>
        <div className="workspace"><div className="workspace-icon"><Boxes size={17} /></div><div><strong>Acme Infrastructure</strong><p>Production workspace</p></div><ChevronsUpDown size={12} className="ml-auto text-muted-foreground" /></div>
        <p className="nav-label">Observability</p>
        <nav>{navigation.map(n=><Link key={n.path} to={n.path} className={`nav-item ${pathname===n.path?'active':''}`}><n.icon /><span>{n.label}</span>{n.path==='/crash-forecast' && <span className="nav-count">1</span>}</Link>)}</nav>
        <div className="mx-6 mt-7 flex items-center gap-2 border-t pt-5 text-[10px] text-muted-foreground"><Cpu size={13} /> eu-central-1 <span className="ml-auto font-mono">v1.0.0</span></div>
        <div className="sidebar-bottom"><div className="cluster-status"><p><span className="status-dot tone-success" /> All systems operational</p><small>3 connected containers</small></div><div className="user"><div className="avatar">YF</div><div><strong>Yassine Frigui</strong><p>Workspace admin</p></div><ShieldCheck size={15} className="ml-auto text-muted-foreground" /></div></div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><Button className="mobile-menu" variant="ghost" size="icon" aria-label="Open navigation" onClick={()=>setOpen(true)}><Menu /></Button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={12} className="text-muted-foreground" /><span>Observability</span><ChevronRight size={12} className="text-muted-foreground" /><strong>{active.section}</strong></div>
          <div className="topbar-actions"><span className={`mode-pill ${mock?'':'live'}`} title={mock?'Using data.json — No live API calls':'Connected to Localhost:3000'}><span className="status-dot" />{mock?'Mock Mode Active':'Backend Live'}<span className="hidden xl:inline text-muted-foreground">{mock?'· offline data':'· localhost:3000'}</span></span><Button variant="outline" size="icon" title="Toggle Live / Mock Mode" aria-label="Toggle Live / Mock Mode" onClick={async()=>{const mode=await api.toggleMockMode(); toast(mode?'Backend unavailable. Mock mode remains active.':'Connected to live backend.');}}><ArrowLeftRight size={13} /></Button><div className="icon-divider" /><Button variant="ghost" size="icon" className="notification" aria-label="View active alerts" asChild><Link to="/crash-forecast"><Bell /></Link></Button><Button variant="ghost" size="icon" aria-label="Connection information" title="Connection information" onClick={()=>toast.info(mock?'Offline dataset active. Connect your Express service on localhost:3000 to receive live telemetry.':'Live telemetry connected to localhost:3000.')}><CircleHelp /></Button></div>
        </header>
        <main className="content">{children}<footer className="page-footer"><span><ShieldCheck size={11} /> Stateful guardrails enabled</span><span>OptiOps Engine <span className="font-mono">v1.0.0</span><span className="status-dot tone-success" /></span></footer></main>
      </div>
    </div><Toaster theme="dark" position="bottom-right" richColors />
  </CockpitContext.Provider>;
}
export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow"><span className="status-dot" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{children ?? <><span className="environment"><span className="status-dot" /> Production</span><span className="text-[10px] text-muted-foreground font-mono">eu-central-1</span></>}</div></div>;
}
export function ContainerToolbar({ children }: { children?: ReactNode }) {
  const { containers, selected, select, range, setRange, mock } = useCockpit();
  return <div className="toolbar"><div className="toolbar-left"><div className="toolbar-select"><Boxes size={14} className="text-muted-foreground" /><label htmlFor="container">Container</label><select id="container" aria-label="Select container" value={selected} onChange={e=>select(e.target.value)}>{containers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="icon-divider" /><select aria-label="Time range" value={range} onChange={e=>setRange(e.target.value)}><option>Last 5m</option><option>Last 15m</option><option>Last 1h</option></select><span className="update-label">{mock?'SAMPLE SNAPSHOT':'LIVE STREAM'}</span></div>{children}</div>;
}
