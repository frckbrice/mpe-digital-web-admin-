import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Projects" />);
    expect(screen.getByRole('heading', { name: /projects/i })).toBeInTheDocument();
  });

  it('renders optional subtitle', () => {
    render(<PageHeader title="Projects" subtitle="Manage your projects" />);
    expect(screen.getByText('Manage your projects')).toBeInTheDocument();
  });

  it('renders optional icon', () => {
    render(<PageHeader title="Projects" icon={<span data-testid="icon">Icon</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders optional action', () => {
    render(<PageHeader title="Projects" action={<button>Add Project</button>} />);
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
  });

  it('renders all props together', () => {
    render(
      <PageHeader
        title="Clients"
        subtitle="View and manage clients"
        icon={<span data-testid="icon">Icon</span>}
        action={<button>Add Client</button>}
      />
    );
    expect(screen.getByRole('heading', { name: /clients/i })).toBeInTheDocument();
    expect(screen.getByText('View and manage clients')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
  });

  it('does not render subtitle when undefined', () => {
    const { container } = render(<PageHeader title="Projects" />);
    const muted = container.querySelector('.text-muted-foreground');
    expect(muted).not.toBeInTheDocument();
  });
});
