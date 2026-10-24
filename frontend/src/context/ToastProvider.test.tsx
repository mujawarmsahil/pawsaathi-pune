import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useToast } from '../hooks/useToast';
import { ToastProvider } from './ToastProvider';

function ToastHarness() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.success('Profile saved', 'Changes are live.')}>
        success
      </button>
      <button type="button" onClick={() => toast.error('Save failed', 'Try again shortly.')}>
        error
      </button>
    </>
  );
}

describe('toast provider', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('stacks every toast and shows the count and state labels', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    fireEvent.click(screen.getByRole('button', { name: 'error' }));

    expect(screen.getByText('2 notifications')).toBeInTheDocument();
    expect(screen.getByText('Profile saved')).toBeInTheDocument();
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('dismisses each toast after five seconds by default', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByText('Profile saved')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByText('Profile saved')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('Profile saved')).not.toBeInTheDocument();
  });
});
