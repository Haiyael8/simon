import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../App';
import * as audio from '../game/audio';
import * as random from '../game/random';
import { HISTORY_KEY, loadHistory } from '../history/historyStorage';
import type { ColorId } from '../game/colors';

vi.mock('../game/audio', () => ({
  unlockAudio: vi.fn(),
  startTone: vi.fn(),
  playWin: vi.fn(),
  playLoss: vi.fn(),
  stopAll: vi.fn(),
}));
vi.mock('../game/random', () => ({ randomColor: vi.fn() }));
vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const LABELS: Record<ColorId, string> = {
  green: 'ירוק',
  red: 'אדום',
  yellow: 'צהוב',
  blue: 'כחול',
};

async function click(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

let pointerId = 0;
async function tap(color: ColorId) {
  const id = ++pointerId;
  fireEvent.pointerDown(screen.getByRole('button', { name: LABELS[color] }), { pointerId: id });
  fireEvent.pointerUp(window, { pointerId: id });
  await advance(300);
}

// Starts a game whose single color is green and loses it with the first press
async function loseStage1() {
  vi.mocked(random.randomColor).mockReturnValueOnce('green');
  await click('התחל משחק');
  await advance(1600);
  await tap('red');
  await advance(1000);
  await click('אישור');
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(audio.unlockAudio).mockResolvedValue(true);
  vi.mocked(audio.startTone).mockImplementation(() => vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('history', () => {
  it('records exactly one loss with 0 completed rounds, even in StrictMode', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await loseStage1();
    const { results } = loadHistory();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ outcome: 'loss', completedRounds: 0 });

    await click('אודות');
    expect(screen.getByText('הפסד')).toBeInTheDocument();
    expect(screen.getByText('0 שלבים שהושלמו')).toBeInTheDocument();
  });

  it('records a win with 10 completed rounds', async () => {
    const seq: ColorId[] = [
      'green', 'red', 'blue', 'yellow', 'green', 'red', 'blue', 'yellow', 'green', 'red',
    ];
    const mock = vi.mocked(random.randomColor);
    for (const c of seq) mock.mockReturnValueOnce(c);
    render(<App />);
    await click('התחל משחק');
    for (let round = 1; round <= 10; round++) {
      await advance(round === 1 ? 1000 : 0);
      await advance(round * 600 + (round - 1) * 250);
      for (let i = 0; i < round; i++) await tap(seq[i]);
      await advance(1700);
    }
    const { results } = loadHistory();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ outcome: 'win', completedRounds: 10 });
  });

  it('does not record on pause, navigation or hiding the app', async () => {
    vi.mocked(random.randomColor).mockReturnValueOnce('green');
    render(<App />);
    await click('התחל משחק');
    await advance(1600);
    await click('אודות');
    await click('בית');
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });

  it('records a result that was decided before moving to About', async () => {
    vi.mocked(random.randomColor).mockReturnValueOnce('green');
    render(<App />);
    await click('התחל משחק');
    await advance(1600);
    await tap('red');
    await click('אודות');
    expect(screen.getByText('הפסד')).toBeInTheDocument();
    expect(loadHistory().results).toHaveLength(1);
  });

  it('keeps 10 results after 11 games, saved across a fresh render', async () => {
    const { unmount } = render(<App />);
    for (let i = 0; i < 11; i++) await loseStage1();
    expect(loadHistory().results).toHaveLength(10);
    unmount();
    render(<App />);
    await click('אודות');
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('cancel keeps history, confirm clears it and shows the empty state', async () => {
    render(<App />);
    await loseStage1();
    await click('אודות');
    await click('מחק היסטוריה');
    expect(screen.getByText('למחוק את ההיסטוריה?')).toBeInTheDocument();
    await click('ביטול');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(loadHistory().results).toHaveLength(1);

    await click('מחק היסטוריה');
    await click('מחק');
    expect(screen.getByText('עדיין אין משחקים שמורים')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).toBeNull();
    expect(loadHistory().results).toHaveLength(0);
  });

  it('shows an error when deleting fails and keeps the list', async () => {
    render(<App />);
    await loseStage1();
    await click('אודות');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await click('מחק היסטוריה');
    await click('מחק');
    expect(screen.getByRole('alert')).toHaveTextContent('לא ניתן היה למחוק את ההיסטוריה');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('keeps the game playable and shows an error when saving fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<App />);
    await loseStage1();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    await click('אודות');
    expect(screen.getByRole('alert')).toHaveTextContent('לא ניתן היה לשמור את תוצאת המשחק');
  });

  it('shows a load error for corrupt storage without blocking the game', async () => {
    localStorage.setItem(HISTORY_KEY, '{bad');
    render(<App />);
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    await click('אודות');
    expect(screen.getByRole('alert')).toHaveTextContent('לא ניתן לטעון את ההיסטוריה');
  });
});
