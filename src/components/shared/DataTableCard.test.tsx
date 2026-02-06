import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTableCard } from './DataTableCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { start?: number; end?: number; total?: number; current?: number }) => {
      if (key === 'common.rangeOf' && opts) return `${opts.start}–${opts.end} of ${opts.total}`;
      if (key === 'common.pageOf' && opts) return `Page ${opts.current} of ${opts.total}`;
      if (key === 'common.rowsPerPage') return 'Rows per page';
      if (key === 'common.previousPage') return 'Previous page';
      if (key === 'common.nextPage') return 'Next page';
      if (key === 'common.noResults') return 'No results.';
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

const mockColumns = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }: { row: { original: { name: string } } }) => row.original.name,
  },
];

describe('DataTableCard', () => {
  const defaultProps = {
    columns: mockColumns,
    data: [{ name: 'Alice' }, { name: 'Bob' }],
    pageCount: 1,
    pagination: { pageIndex: 0, pageSize: 10 },
    onPaginationChange: vi.fn(),
    totalCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with data', () => {
    render(<DataTableCard {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(
      <DataTableCard {...defaultProps} data={[]} totalCount={0} emptyMessage="No clients found" />
    );
    expect(screen.getByText('No clients found')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading', () => {
    const { container } = render(<DataTableCard {...defaultProps} isLoading />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('applies accent border when accentBorder is true', () => {
    const { container } = render(<DataTableCard {...defaultProps} accentBorder />);
    const card = container.querySelector('[class*="border-[#fe4438]"]');
    expect(card).toBeInTheDocument();
  });

  it('renders pagination when totalCount > 0', () => {
    render(<DataTableCard {...defaultProps} />);
    expect(screen.getByText(/1–2 of 2/)).toBeInTheDocument();
  });
});
