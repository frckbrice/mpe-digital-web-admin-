import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Delete client?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: vi.fn(),
  };

  it('renders title and description when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /delete client/i })).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenChange(false) when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('uses custom cancel label', () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="No, keep it" />);
    expect(screen.getByRole('button', { name: /no, keep it/i })).toBeInTheDocument();
  });

  it('disables buttons when isPending', () => {
    render(<ConfirmDialog {...defaultProps} isPending />);
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('applies destructive variant to confirm button by default', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    expect(confirmBtn).toHaveClass('bg-destructive');
  });

  it('applies default variant when specified', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);
    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    expect(confirmBtn).not.toHaveClass('bg-destructive');
  });
});
