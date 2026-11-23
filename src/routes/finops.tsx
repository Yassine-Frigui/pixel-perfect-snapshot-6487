import { createFileRoute } from '@tanstack/react-router';
import { Finops } from '@/components/optiops/finops';
export const Route = createFileRoute('/finops')({
  head: () => ({ meta: [
    { title: 'OptiOps | FinOps & GitOps Studio' },
    { name: 'description', content: 'Quantify cloud spend waste, audit container quotas, and generate right-sizing GitOps patches.' },
    { property: 'og:title', content: 'OptiOps | FinOps & GitOps Studio' },
    { property: 'og:description', content: 'Quantify cloud spend waste, audit container quotas, and generate right-sizing GitOps patches.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Finops,
});
