import { createFileRoute } from '@tanstack/react-router';
import { Safety } from '@/components/optiops/safety';
export const Route = createFileRoute('/safety')({
  head: () => ({ meta: [
    { title: 'OptiOps | Circuit Breakers & Safety' },
    { name: 'description', content: 'Manage circuit breakers and enforce stateful workload protection across your infrastructure.' },
    { property: 'og:title', content: 'OptiOps | Circuit Breakers & Safety' },
    { property: 'og:description', content: 'Manage circuit breakers and enforce stateful workload protection across your infrastructure.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Safety,
});
