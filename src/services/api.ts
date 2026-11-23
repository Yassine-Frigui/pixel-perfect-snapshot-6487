import mockData from '@/mock/data.json';
import { isRemediationBlocked, type RemediationAction } from './rules';
import { io, type Socket } from 'socket.io-client';

export type Container = typeof mockData.containers[number];
export type UslModel = typeof mockData.uslModel;
export type Forecast = Container['ttcForecast'];
export const BACKEND_URL = 'http://localhost:3000';
type Listener = (mock: boolean) => void;
export class ApiService {
  private isMockMode = true;
  private manualMock = false;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private socket: Socket | undefined;
  private telemetryListeners = new Set<(container: Partial<Container> & { id: string }) => void>();
  private containers: Container[] = structuredClone(mockData.containers);
  start() {
    void this.checkBackendHealth();
    this.timer ??= setInterval(() => { if (!this.manualMock) void this.checkBackendHealth(); }, 30000);
    return () => { clearInterval(this.timer); this.timer = undefined; this.socket?.disconnect(); };
  }
  async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(2000) });
      this.setMockMode(!res.ok || this.manualMock);
      return res.ok;
    } catch { this.setMockMode(true); return false; }
  }
  setMockMode(mock: boolean) {
    this.isMockMode = mock;
    this.socket?.disconnect();
    if (!mock && typeof window !== 'undefined') {
      this.socket = io(BACKEND_URL, { reconnectionAttempts: 3 });
      this.socket.on('telemetry', (event: Partial<Container> & { id: string }) => {
        if (event && typeof event.id === 'string') this.telemetryListeners.forEach(cb => cb(event));
      });
      this.socket.on('connect_error', () => this.setMockMode(true));
    }
    this.listeners.forEach(cb => cb(mock));
  }
  async toggleMockMode() {
    if (this.isMockMode) { this.manualMock = false; await this.checkBackendHealth(); }
    else { this.manualMock = true; this.setMockMode(true); }
    return this.isMockMode;
  }
  getIsMockMode() { return this.isMockMode; }
  onModeChange(cb: Listener) { this.listeners.add(cb); return () => { this.listeners.delete(cb); }; }
  onTelemetry(cb: (container: Partial<Container> & { id: string }) => void) {
    this.telemetryListeners.add(cb); return () => { this.telemetryListeners.delete(cb); };
  }
  private async request<T>(path: string, fallback: () => T, body?: unknown, method?: string): Promise<T> {
    if (this.isMockMode) return fallback();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/${path}`, {
        method: method ?? (body ? 'POST' : 'GET'),
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      return await res.json() as T;
    } catch { this.setMockMode(true); return fallback(); }
  }
  async getContainers() { return this.request<Container[]>('telemetry/containers', () => structuredClone(this.containers)); }
  async startBenchmark(params: { target_rps: number; sla_latency_ms: number; git_repo_url?: string }) {
    return this.request('sandbox/benchmark', () => ({ status: 'accepted', benchmark_run_id: 'mock-run-uuid-1', state: 'RUNNING' }), params);
  }
  async getBenchmarkResults(runId: string) { return this.request(`sandbox/benchmark/${runId}/results`, () => structuredClone(mockData.uslModel)); }
  async getFinopsAudits() {
    return this.request('finops/audits', () => this.containers.map(c => ({ containerId: c.id, p95CpuUsage: c.finops.p95CpuPercent, p95RamBytes: c.finops.p95MemoryMb * 1024 * 1024, slackRatio: c.finops.overallSlackRatio, estimatedMonthlyWasteEur: c.finops.monthlyWasteEur, generatedGitopsDiff: c.finops.gitopsDiff })));
  }
  async auditContainer(id: string, params: { allocated_cores?: number; allocated_memory_bytes?: number }) {
    const c = this.find(id); return this.request(`finops/audit/${id}`, () => c.finops, params);
  }
  async getTtcForecast(id: string) { return this.request('finops/forecast-ttc', () => this.find(id).ttcForecast, { container_id: id }); }
  async getCircuitBreakers() {
    return this.request('resilience/circuit-breakers', () => this.containers.map(c => ({ containerId: c.id, state: c.circuitBreaker.state, consecutiveFailures: c.circuitBreaker.consecutiveFailures, currentCooldownSeconds: c.circuitBreaker.cooldownSeconds })));
  }
  async tripCircuitBreaker(id: string, reason: string) {
    return this.request(`resilience/circuit-breakers/${id}/trip`, () => { const c = this.find(id); c.circuitBreaker.state = 'OPEN'; c.circuitBreaker.consecutiveFailures = 5; return { success: true, message: 'Tripped in mock mode' }; }, { reason });
  }
  async resetCircuitBreaker(id: string) {
    return this.request(`resilience/circuit-breakers/${id}/reset`, () => { const c = this.find(id); c.circuitBreaker.state = 'CLOSED'; c.circuitBreaker.consecutiveFailures = 0; return { success: true, message: 'Reset in mock mode' }; }, undefined, 'POST');
  }
  async executeRemediation(id: string, action: RemediationAction) {
    const c = this.find(id);
    if (isRemediationBlocked(c.isStateful, action)) return { success: false, blockedBy: 'STATEFUL_GUARDRAIL', reason: `[STATEFUL SAFETY VIOLATION] Automated ${action} rejected on stateful database '${id}' to prevent data corruption.` };
    return this.request<{ success: boolean; reason: string }>(`resilience/remediate/${id}`, () => ({ success: true, reason: `${action} completed in mock mode` }), { action });
  }
  private find(id: string) { const c = this.containers.find(c => c.id === id); if (!c) throw new Error('Container not found'); return c; }
}
export const api = new ApiService();
