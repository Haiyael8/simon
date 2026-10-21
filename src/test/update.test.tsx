import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

vi.mock('../game/audio', () => ({
  unlockAudio: vi.fn().mockResolvedValue(true),
  startTone: vi.fn(),
  playWin: vi.fn(),
  playLoss: vi.fn(),
  stopAll: vi.fn(),
}));

const sw = vi.hoisted(() => ({
  onNeedRefresh: undefined as undefined | (() => void),
  update: vi.fn(),
}));

vi.mock('virtual:pwa-register', () => ({
  registerSW: (opts: { onNeedRefresh: () => void }) => {
    sw.onNeedRefresh = opts.onNeedRefresh;
    return sw.update;
  },
}));

describe('update prompt', () => {
  beforeEach(() => sw.update.mockClear());

  it('is hidden until an update is waiting', () => {
    render(<App />);
    expect(screen.queryByText('גרסה חדשה זמינה')).toBeNull();
  });

  it('shows when idle and refreshes only on click', async () => {
    const user = userEvent.setup();
    render(<App />);
    act(() => sw.onNeedRefresh?.());
    expect(screen.getByText('גרסה חדשה זמינה')).toBeInTheDocument();
    expect(sw.update).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'רענן' }));
    expect(sw.update).toHaveBeenCalledTimes(1);
    expect(sw.update).toHaveBeenCalledWith(true);
  });

  it('hides while a game is active', async () => {
    const user = userEvent.setup();
    render(<App />);
    act(() => sw.onNeedRefresh?.());
    await user.click(screen.getByRole('button', { name: 'התחל משחק' }));
    expect(screen.queryByText('גרסה חדשה זמינה')).toBeNull();
  });
});
