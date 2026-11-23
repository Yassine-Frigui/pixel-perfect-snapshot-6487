import { createFileRoute } from '@tanstack/react-router';
import { Fitting } from '@/components/optiops/fitting';
export const Route = createFileRoute('/server-fitting')({
  head: () => ({ meta: [
    { title: 'OptiOps | Server Fitting Studio' },
    { name: 'description', content: 'Model pre-deployment capacity with Universal Scalability Law benchmarks and cloud sizing recommendations.' },
    { property: 'og:title', content: 'OptiOps | Server Fitting Studio' },
    { property: 'og:description', content: 'Model pre-deployment capacity with Universal Scalability Law benchmarks and cloud sizing recommendations.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Fitting,
});
