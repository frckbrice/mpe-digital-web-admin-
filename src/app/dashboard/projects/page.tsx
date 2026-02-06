import type { Metadata } from 'next';
import { ProjectsPageClient } from '@/components/features/projects';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Browse projects',
};

export default function ProjectsPage() {
  return <ProjectsPageClient />;
}
