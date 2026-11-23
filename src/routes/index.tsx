import { createFileRoute } from '@tanstack/react-router';
import { Telemetry } from '@/components/optiops/telemetry';
export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'OptiOps | Live Telemetry' },
    { name: 'description', content: 'Real-time CPU, memory, network telemetry and explainable anomaly defense.' },
    { property: 'og:title', content: 'OptiOps | Live Telemetry' },
    { property: 'og:description', content: 'Real-time CPU, memory, network telemetry and explainable anomaly defense.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Telemetry,
});
