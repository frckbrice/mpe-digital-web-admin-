import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterCard } from './FilterCard';

describe('FilterCard', () => {
  it('renders title and children', () => {
    render(
      <FilterCard title="Filters">
        <button>Apply</button>
      </FilterCard>
    );
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
  });

  it('applies accent border when accentBorder is true', () => {
    const { container } = render(
      <FilterCard title="Filters" accentBorder>
        <span>Filter controls</span>
      </FilterCard>
    );
    const card = container.querySelector('[class*="border-[#fe4438]"]');
    expect(card).toBeInTheDocument();
  });

  it('renders without accent border by default', () => {
    const { container } = render(
      <FilterCard title="Filters">
        <span>Filter controls</span>
      </FilterCard>
    );
    const accentBorder = container.querySelector('[class*="border-[#fe4438]"]');
    expect(accentBorder).not.toBeInTheDocument();
  });
});
