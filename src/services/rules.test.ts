import { describe, it, expect } from 'vitest';
import { efficiencyGrade, isCriticalAnomaly, isRemediationBlocked, uslThroughput } from './rules';
import { ApiService } from './api';
import data from '@/mock/data.json';
describe('OptiOps safety and sizing rules', () => {
  it('uses the inclusive 0.6618 anomaly threshold', () => { expect(isCriticalAnomaly(0.6618)).toBe(true); expect(isCriticalAnomaly(0.6617)).toBe(false); });
  it.each([[0.10,'A'],[0.1001,'B'],[0.25,'B'],[0.2501,'C'],[0.35,'C'],[0.3501,'D'],[0.50,'D'],[0.5001,'F']] as const)('grades slack %s as %s', (slack, grade) => expect(efficiencyGrade(slack)).toBe(grade));
  it('blocks automated database restarts', () => expect(isRemediationBlocked(true,'RESTART')).toBe(true));
  it('blocks automated database memory downsizing', () => expect(isRemediationBlocked(true,'DOWNSIZE_MEMORY')).toBe(true));
  it('permits stateful scale-up and stateless restarts', () => { expect(isRemediationBlocked(true,'SCALE_UP')).toBe(false); expect(isRemediationBlocked(false,'RESTART')).toBe(false); });
  it('enforces stateful protection in the API layer', async () => { const api = new ApiService(); expect((await api.executeRemediation('postgres-master','RESTART')).success).toBe(false); });
  it('trips and resets mock breakers', async () => { const api = new ApiService(); await api.tripCircuitBreaker('auth-api','Test'); expect((await api.getCircuitBreakers()).find(c=>c.containerId==='auth-api')?.state).toBe('OPEN'); await api.resetCircuitBreaker('auth-api'); expect((await api.getCircuitBreakers()).find(c=>c.containerId==='auth-api')?.state).toBe('CLOSED'); });
  it('implements Gunther USL including coherency degradation', () => { expect(uslThroughput(1,44.45,.0566,.001013)).toBe(44.45); expect(uslThroughput(64,44.45,.0566,.001013)).toBeLessThan(uslThroughput(30,44.45,.0566,.001013)); });
  it('preserves the supplied SKU prices', () => expect(data.uslModel.skuRecommendations.map(s=>s.monthlyCostEur)).toEqual([7.49,49.9,14.98]));
});
