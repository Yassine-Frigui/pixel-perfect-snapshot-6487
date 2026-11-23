import { createFileRoute } from '@tanstack/react-router';
import { ForecastPage } from '@/components/optiops/forecast';
export const Route = createFileRoute('/crash-forecast')({
  head: () => ({ meta: [
    { title: 'OptiOps | Time-to-Crash Forecaster' },
    { name: 'description', content: 'Predict memory saturation with Bayesian confidence intervals and protected preemptive remediation.' },
    { property: 'og:title', content: 'OptiOps | Time-to-Crash Forecaster' },
    { property: 'og:description', content: 'Predict memory saturation with Bayesian confidence intervals and protected preemptive remediation.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ForecastPage,
});
