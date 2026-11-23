import { useState } from 'react';
import { Activity, ArrowDown, ArrowUp, ArrowUpRight, Check, ChevronRight, Clock3, Cpu, Database, Gauge, Info, Network, Radar, RefreshCw, ShieldCheck, TriangleAlert, Zap } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ContainerToolbar, PageHeading, useCockpit, useContainer } from './shell';
import { isCriticalAnomaly } from '@/services/rules';
export function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {name?: string; value?: number|string; color?: string}[]; label?: string|number }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><p>{label}</p>{payload.map((p,i)=><p key={i}>{p.name}: {typeof p.value==='number'?p.value.toFixed(1):p.value}</p>)}</div>;
}
export function Ring({ percentage }: { percentage: number }) { return <svg className="memory-ring" viewBox="0 0 48 48" aria-label={`${percentage.toFixed(0)}% memory used`}><circle cx="24" cy="24" r="19" fill="none" stroke="var(--secondary)" strokeWidth="4" /><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${Math.min(100,percentage)*1.194} 119.4`} transform="rotate(-90 24 24)" strokeLinecap="round" /><text x="24" y="27" textAnchor="middle" fill="var(--foreground)" fontSize="9" fontFamily="var(--font-mono)">{percentage.toFixed(0)}%</text></svg>; }
function Sparkline({ critical=false }: { critical?: boolean }) { return <svg className={`sparkline ${critical?'tone-critical':''}`} viewBox="0 0 90 30" aria-hidden="true"><path d="M0 24L5 21L10 24L15 19L20 22L25 16L30 21L35 17L40 19L45 12L50 15L55 10L60 13L65 8L70 9L75 4L80 7L85 3L90 5" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>; }
export function Telemetry() {
  const c = useContainer(); const { range, mock, refresh } = useCockpit();
  const [incident, setIncident] = useState<string|null>(null);
  const spiked=incident===c.id;
  const score=spiked?0.94:c.anomalyScore;
  const critical=isCriticalAnomaly(score);
  const cpu=spiked?98.7:c.currentCpu;
  const memory=spiked?Math.min(c.allocatedMemoryMb-40,c.currentMemoryMb*1.12):c.currentMemoryMb;
  const minutes=range==='Last 5m'?5:range==='Last 1h'?60:15;
  const chartData=Array.from({length:46},(_,i)=>{
    const offset=minutes*(45-i)/45;
    const time=new Date(Date.UTC(2026,10,23,15,24)-offset*60000);
    return {time:`${String(time.getUTCHours()).padStart(2,'0')}:${String(time.getUTCMinutes()).padStart(2,'0')}`,cpu:Math.max(0,cpu-12+Math.sin(i*1.8)*7+Math.cos(i*.5)*5+(i>30?8:0)),memory:Math.max(0,memory-(45-i)*(critical?10:1))+Math.sin(i*.4)*14};
  });
  return <>
    <PageHeading eyebrow="Real-time observability" title="Live telemetry cockpit" description="Every signal. Every anomaly. One step ahead of your infrastructure." />
    <ContainerToolbar><Button size="sm" variant="outline" disabled={!mock} onClick={()=>{setIncident(spiked?null:c.id);toast(spiked?'Incident simulation cleared.':'Incident spike injected into sample telemetry.');}}><Zap size={13} />{spiked?'Clear incident spike':'Simulate incident spike'}</Button></ContainerToolbar>
    <div className="kpi-grid">
      <div className="panel kpi"><div className="kpi-label">CPU utilization<Cpu /></div><div className="kpi-value">{cpu.toFixed(1)}<small>%</small></div><div className="kpi-footer"><ArrowUpRight size={12} className="tone-warning" /><span className="tone-warning">+12.4%</span> vs. previous interval</div><Sparkline /></div>
      <div className="panel kpi"><div className="kpi-label">Memory RSS<Database /></div><div className="metric-memory"><Ring percentage={memory/c.allocatedMemoryMb*100} /><div><div className="kpi-value">{memory.toLocaleString()}<small>MB</small></div><span className="text-[9px] text-muted-foreground font-mono">/ {c.allocatedMemoryMb.toLocaleString()} MB quota</span></div></div><div className="kpi-footer"><span className={critical?'tone-warning':'tone-success'}>{critical?'Approaching memory limit':'Within allocated quota'}</span></div></div>
      <div className="panel kpi"><div className="kpi-label">Network I/O<Network /></div><div className="kpi-value">{(c.currentNetRxKb+c.currentNetTxKb).toFixed(1)}<small>KB/s</small></div><div className="kpi-footer"><ArrowDown size={11} className="tone-primary" />RX <span className="text-foreground font-mono">{c.currentNetRxKb}</span><span className="mx-1">·</span><ArrowUp size={11} className="tone-forecast" />TX <span className="text-foreground font-mono">{c.currentNetTxKb}</span></div><Sparkline /></div>
      <div className={`panel kpi ${critical?'critical':''}`}><div className="kpi-label">Anomaly score<Gauge className={critical?'tone-critical':''} /></div><div className={`kpi-value ${critical?'tone-critical':'tone-success'}`}>{score.toFixed(2)}<small>/ 1.00</small><Radar size={31} className={`ml-auto ${critical?'pulse':''}`} /></div><span className={`badge ${critical?'tone-critical':'tone-success'}`}><span className={`status-dot ${critical?'pulse':''}`} />{critical?'Critical anomaly detected':'Nominal operation'}</span></div>
    </div>
    <section className="panel"><div className="panel-header"><div><h2><Activity />Resource utilization</h2><p>CPU and memory consumption across the selected time window</p></div><div className="legend"><span><i className="tone-primary" />CPU utilization</span><span><i className="tone-forecast" />Memory RSS</span><span><i className="tone-critical" />Anomaly window</span><Button size="icon" variant="ghost" aria-label="Refresh telemetry" title="Refresh telemetry" onClick={async()=>{await refresh();toast.success('Telemetry refreshed.');}}><RefreshCw size={13} /></Button></div></div>
      <div className="chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{top:10,right:8,left:4,bottom:10}}><defs><linearGradient id="cpu-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={.15} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="time" minTickGap={70} axisLine={false} tickLine={false} tickMargin={12} /><YAxis yAxisId="cpu" domain={[0,100]} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false} width={40} tickCount={5} /><YAxis yAxisId="memory" orientation="right" domain={[0,c.allocatedMemoryMb]} tickFormatter={v=>`${(v/1024).toFixed(0)} GB`} axisLine={false} tickLine={false} width={40} tickCount={5} /><Tooltip content={<ChartTooltip />} />{critical && <ReferenceArea yAxisId="cpu" x1={chartData[32]?.time} x2={chartData[45]?.time} fill="var(--destructive)" fillOpacity={.055} /> }<Area yAxisId="cpu" type="monotone" dataKey="cpu" name="CPU %" fill="url(#cpu-fill)" stroke="var(--primary)" strokeWidth={2} isAnimationActive={false} /><Line yAxisId="memory" type="monotone" dataKey="memory" name="Memory MB" stroke="var(--forecast)" strokeWidth={2} dot={false} isAnimationActive={false} /><ReferenceLine yAxisId="cpu" y={90} stroke="var(--warning)" strokeOpacity={.35} strokeDasharray="4 5" /></ComposedChart></ResponsiveContainer></div>
      <div className="chart-footer"><span><span className="status-dot tone-success" /> {mock?'Sample telemetry':'Socket.io stream connected'}<span className="mx-2">·</span>20s resolution</span><span>Threshold s(x) ≥ 0.6618<span className="mx-2">·</span>UTC</span></div>
    </section>
    <div className="telemetry-lower">
      <section className="panel"><div className="panel-header"><h2><Radar />Diagnostic explainability</h2><span className="badge tone-forecast">Isolation Forest</span></div><div className="diagnosis"><div className="diagnosis-heading">{critical?<TriangleAlert size={15} className="tone-critical" />:<ShieldCheck size={15} className="tone-success" />}<strong className={!critical?'tone-success':''}>{spiked?'RUNAWAY_CPU_LOOP':c.anomalyTag}</strong><span className="badge tone-critical ml-auto">{critical?'High confidence':'Nominal'}</span></div><p>{spiked?'Rapid CPU saturation detected. Sustained utilization exceeds 98% with elevated resource pressure.':c.anomalyExplanation}</p><div className="mt-5 text-[9px] text-muted-foreground">METRIC ATTRIBUTION</div>{(critical?[['Memory slope',72],['CPU mean',18],['Disk IOPS',10]]:[['Memory slope',12],['CPU mean',24],['Disk IOPS',64]]).map(([name,value])=><div className="attribution" key={name}><span className="text-muted-foreground">{name}</span><div className="progress-track"><span style={{width:`${value}%`}} /></div><span className="font-mono">{value}%</span></div>)}<Button variant="link" size="sm" className="px-0 mt-4 h-6 text-[10px]" asChild><Link to="/crash-forecast">Inspect crash forecast<ArrowUpRight size={12} /></Link></Button></div></section>
      <section className="panel"><div className="panel-header"><h2><Clock3 />Recent activity</h2><span className="badge tone-primary">{mock?'Sample events':'Live events'}</span></div>
        <div className="activity-row"><span className={`activity-icon ${critical?'tone-critical':'tone-success'}`}><TriangleAlert /></span><div><strong>{critical?'Memory anomaly detected':'Container health check passed'}</strong><p><span className="font-mono">{c.name}</span> · Score {score.toFixed(2)}</p></div><time>15:24:00</time></div>
        <div className="activity-row"><span className="activity-icon tone-forecast"><ChartIcon /></span><div><strong>{critical?'Crash forecast updated':'Forecast remains stable'}</strong><p>{critical?'OOM collision predicted in 52 minutes':'No significant memory drift'}</p></div><time>15:23:40</time></div>
        <div className="activity-row"><span className="activity-icon tone-primary"><Cpu /></span><div><strong>FinOps audit completed</strong><p>€142.30 monthly savings identified</p></div><time>15:20:00</time></div>
        <div className="activity-row"><span className="activity-icon tone-success"><Check /></span><div><strong>Circuit breaker health check</strong><p>All 3 breakers closed · No failures</p></div><time>15:19:20</time></div>
      </section>
    </div>
  </>;
}
function ChartIcon() { return <Activity />; }
