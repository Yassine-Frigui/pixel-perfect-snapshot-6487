export const ANOMALY_THRESHOLD = 0.6618;
export function isCriticalAnomaly(score: number) { return score >= ANOMALY_THRESHOLD; }
export function efficiencyGrade(slack: number) {
  if (slack <= 0.10) return 'A';
  if (slack <= 0.25) return 'B';
  if (slack <= 0.35) return 'C';
  if (slack <= 0.50) return 'D';
  return 'F';
}
export type RemediationAction = 'RESTART' | 'DOWNSIZE_MEMORY' | 'SCALE_UP';
export function isRemediationBlocked(stateful: boolean, action: RemediationAction) {
  return stateful && (action === 'RESTART' || action === 'DOWNSIZE_MEMORY');
}
export function uslThroughput(n: number, gamma: number, alpha: number, beta: number) {
  return gamma * n / (1 + alpha * (n - 1) + beta * n * (n - 1));
}
