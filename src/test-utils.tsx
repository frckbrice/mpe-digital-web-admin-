/**
 * Test utilities for component and integration tests.
 * Provides renderWithProviders (as render) with QueryClient so React Query hooks work in tests.
 */
import * as React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Wrapper for rendering components that need QueryClient (e.g. React Query).
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper = createWrapper();
  return render(ui, {
    wrapper: Wrapper,
    ...options,
  });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
