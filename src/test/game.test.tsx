import { act, fireEvent, render, screen } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { App } from '../App';
import * as audio from '../game/audio';
import * as random from '../game/random';
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

const LABELS: Record<ColorId, string> = {
  green: 'ירוק',
  red: 'אדום',
  yellow: 'צהוב',
  blue: 'כחול',
};

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function queueColors(colors: ColorId[]) {
  const mock = vi.mocked(random.randomColor);
  mock.mockReset();
  for (const color of colors) mock.mockReturnValueOnce(color);
}

async function startGame() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'התחל משחק' }));
  });
}

let pointerCounter = 0;
async function tap(color: ColorId) {
  const id = ++pointerCounter;
  fireEvent.pointerDown(screen.getByRole('button', { name: LABELS[color] }), { pointerId: id });
  fireEvent.pointerUp(window, { pointerId: id });
  await advance(300);
}

// Total time to present `length` colors, from the first color's start
const presentationMs = (length: number) => length * 600 + (length - 1) * 250;

// Waits for the presentation, then taps the whole sequence
async function playRound(sequence: ColorId[], wait: number) {
  await advance(wait + presentationMs(sequence.length));
  for (const color of sequence) await tap(color);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(audio.unlockAudio).mockResolvedValue(true);
  vi.mocked(audio.startTone).mockImplementation(() => vi.fn());
  pointerCounter = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('game flow', () => {
  it('blocks presses while presenting and shows the status text', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל משחק' })).toBeNull();
    expect(screen.getByRole('button', { name: 'ירוק' })).toBeDisabled();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'אדום' }), { pointerId: 1 });
    await advance(1000 + 600);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.queryByText('נפסלת!')).toBeNull();
  });

  it('uses fixed timing: 1000ms before, 600ms lit, 250ms gap', async () => {
    queueColors(['green', 'red']);
    render(<App />);
    await startGame();
    const startTone = vi.mocked(audio.startTone);
    await advance(999);
    expect(startTone).not.toHaveBeenCalled();
    await advance(1);
    expect(startTone).toHaveBeenCalledWith('green');
    await advance(600);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    // tap() already waited 300ms of the 1000ms the completed stage stays on screen
    await tap('green');
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    await advance(699);
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    await advance(1);
    expect(screen.getByText('שלב 2 מתוך 10')).toBeInTheDocument();
    startTone.mockClear();
    await advance(999);
    expect(startTone).not.toHaveBeenCalled();
    await advance(1);
    expect(startTone).toHaveBeenLastCalledWith('green');
    await advance(600 + 249);
    expect(startTone).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(startTone).toHaveBeenLastCalledWith('red');
  });

  it('loses on the first press of stage 1 with a delayed message and sound, no confetti', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1600);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'אדום' }), { pointerId: 1 });
    expect(audio.startTone).toHaveBeenLastCalledWith('red');
    fireEvent.pointerUp(window, { pointerId: 1 });
    await advance(999);
    expect(screen.queryByText('נפסלת!')).toBeNull();
    expect(audio.playLoss).not.toHaveBeenCalled();
    await advance(1);
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('0 שלבים שהושלמו')).toBeInTheDocument();
    expect(audio.playLoss).toHaveBeenCalledTimes(1);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('reports completed rounds on a later loss', async () => {
    queueColors(['green', 'red', 'blue']);
    render(<App />);
    await startGame();
    await playRound(['green'], 1000);
    await playRound(['green', 'red'], 2000);
    await advance(2000 + presentationMs(3));
    await tap('yellow');
    await advance(1000);
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('2 שלבים שהושלמו')).toBeInTheDocument();
    expect(screen.getByText('שלב 3 מתוך 10')).toBeInTheDocument();
  });

  it('wins after stage 10 with confetti; OK returns to idle and a new game has a new sequence', async () => {
    const sequence: ColorId[] = [
      'green', 'red', 'yellow', 'blue', 'blue', 'red', 'green', 'yellow', 'red', 'blue',
    ];
    queueColors(sequence);
    render(<App />);
    await startGame();
    for (let round = 1; round <= 10; round++) {
      await playRound(sequence.slice(0, round), round === 1 ? 1000 : 2000);
    }
    expect(confetti).not.toHaveBeenCalled();
    // tap() already waited 300ms after the final press
    await advance(699);
    expect(screen.queryByText('כל הכבוד! ניצחת!')).toBeNull();
    await advance(1);
    expect(screen.getByText('כל הכבוד! ניצחת!')).toBeInTheDocument();
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(screen.getByText('שלב 10 מתוך 10')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    expect(screen.queryByText('כל הכבוד! ניצחת!')).toBeNull();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();

    queueColors(['blue']);
    await startGame();
    await advance(1000);
    expect(audio.startTone).toHaveBeenLastCalledWith('blue');
  });

  it('does not start and shows an error when audio cannot start', async () => {
    vi.mocked(audio.unlockAudio).mockResolvedValue(false);
    render(<App />);
    await startGame();
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו להפעיל צליל');
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(screen.queryByText('המשחק מציג את הרצף')).toBeNull();
  });

  it('ignores a second touch while a finger is down', async () => {
    queueColors(['green', 'red']);
    render(<App />);
    await startGame();
    await playRound(['green'], 1000);
    await advance(2000 + presentationMs(2));
    fireEvent.pointerDown(screen.getByRole('button', { name: 'ירוק' }), { pointerId: 1 });
    // A second finger on the wrong color must not count
    fireEvent.pointerDown(screen.getByRole('button', { name: 'כחול' }), { pointerId: 2 });
    fireEvent.pointerUp(window, { pointerId: 2 });
    fireEvent.pointerUp(window, { pointerId: 1 });
    await advance(300);
    await tap('red');
    expect(screen.queryByText('נפסלת!')).toBeNull();
    await advance(1000);
    expect(screen.queryByText('נפסלת!')).toBeNull();
  });

  it('keeps light and sound for at least 300ms after a quick tap', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1600);
    const stop = vi.fn();
    vi.mocked(audio.startTone).mockReturnValueOnce(stop);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'ירוק' }), { pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });
    await advance(299);
    expect(stop).not.toHaveBeenCalled();
    await advance(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('leaving to About while presenting pauses; Home shows Resume and does not auto-play', async () => {
    queueColors(['green', 'red']);
    render(<App />);
    await startGame();
    await advance(1200);
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    expect(audio.stopAll).toHaveBeenCalled();
    vi.mocked(audio.startTone).mockClear();
    await advance(10000);
    expect(audio.startTone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל משחק' })).toBeNull();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    await advance(10000);
    expect(audio.startTone).not.toHaveBeenCalled();
    expect(screen.queryByText('נפסלת!')).toBeNull();
  });

  it('Resume replays the whole sequence of the same stage after partial input', async () => {
    queueColors(['green', 'red']);
    render(<App />);
    await startGame();
    await playRound(['green'], 1000);
    await advance(2000 + presentationMs(2));
    await tap('green');
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.getByText('שלב 2 מתוך 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'אדום' })).toBeDisabled();

    vi.mocked(audio.startTone).mockClear();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'המשך משחק' }));
    });
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).toBeNull();
    await advance(1000);
    expect(audio.startTone).toHaveBeenLastCalledWith('green');
    await advance(600 + 250);
    expect(audio.startTone).toHaveBeenLastCalledWith('red');
    expect(audio.startTone).toHaveBeenCalledTimes(2);
    await advance(600);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    expect(screen.getByText('שלב 2 מתוך 10')).toBeInTheDocument();
    await tap('green');
    await tap('red');
    await advance(2000);
    expect(screen.getByText('שלב 3 מתוך 10')).toBeInTheDocument();
  });

  it('pausing mid-input is not a loss', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1600);
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    await advance(5000);
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.queryByText('נפסלת!')).toBeNull();
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
  });

  it('hiding the app pauses and returning does not resume', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1200);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(audio.stopAll).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
    vi.mocked(audio.startTone).mockClear();
    hidden.mockReturnValue(false);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(5000);
    expect(audio.startTone).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
    hidden.mockRestore();
  });

  it('pagehide pauses an active game', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1200);
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
  });

  it('stays paused with an error when audio cannot resume, and ignores double taps', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1200);
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    vi.mocked(audio.unlockAudio).mockResolvedValueOnce(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'המשך משחק' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו להפעיל צליל');
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();

    vi.mocked(audio.unlockAudio).mockClear();
    await act(async () => {
      const button = screen.getByRole('button', { name: 'המשך משחק' });
      fireEvent.click(button);
      fireEvent.click(button);
    });
    expect(audio.unlockAudio).toHaveBeenCalledTimes(1);
    vi.mocked(audio.startTone).mockClear();
    await advance(1000);
    expect(audio.startTone).toHaveBeenCalledTimes(1);
  });

  it('a decisive press while away keeps the result and shows the message on return', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1600);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'אדום' }), { pointerId: 1 });
    fireEvent.pointerUp(window, { pointerId: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    await advance(2000);
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).toBeNull();
  });

  it('leaving to About with the end message open returns to the start state', async () => {
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1600);
    await tap('red');
    await advance(1000);
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.queryByText('נפסלת!')).toBeNull();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).toBeNull();
  });

  it('writes only the history key, never the active game state', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    queueColors(['green']);
    render(<App />);
    await startGame();
    await advance(1600);
    await tap('red');
    await advance(1000);
    expect(setItem.mock.calls.map(([key]) => key)).toEqual(['simon.history.v1']);
  });
});
