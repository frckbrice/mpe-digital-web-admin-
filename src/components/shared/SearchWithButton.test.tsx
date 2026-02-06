import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchWithButton } from './SearchWithButton';

describe('SearchWithButton', () => {
  it('renders input with placeholder and search button', () => {
    render(
      <SearchWithButton
        placeholder="Search clients..."
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText('Search clients...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('displays the value', () => {
    render(
      <SearchWithButton placeholder="Search" value="john" onChange={vi.fn()} onSearch={vi.fn()} />
    );
    expect(screen.getByDisplayValue('john')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SearchWithButton placeholder="Search" value="" onChange={onChange} onSearch={vi.fn()} />
    );
    await user.type(screen.getByPlaceholderText('Search'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('calls onSearch when search button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <SearchWithButton placeholder="Search" value="query" onChange={vi.fn()} onSearch={onSearch} />
    );
    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(
      <SearchWithButton placeholder="Search" value="query" onChange={vi.fn()} onSearch={onSearch} />
    );
    const input = screen.getByPlaceholderText('Search');
    await user.type(input, '{Enter}');
    expect(onSearch).toHaveBeenCalled();
  });

  it('uses custom aria label for search button', () => {
    render(
      <SearchWithButton
        placeholder="Search"
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
        ariaLabel="Search clients"
      />
    );
    expect(screen.getByRole('button', { name: /search clients/i })).toBeInTheDocument();
  });
});
