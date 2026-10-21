import {
  HISTORY_KEY,
  addResult,
  clearHistory,
  createResult,
  loadHistory,
  type GameResult,
} from '../history/historyStorage';

const make = (n: number): GameResult => ({
  id: `id-${n}`,
  finishedAt: new Date(2026, 0, 1, 10, n).toISOString(),
  completedRounds: n % 11,
  outcome: n % 2 ? 'win' : 'loss',
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('historyStorage', () => {
  it('starts empty without an error', () => {
    expect(loadHistory()).toEqual({ results: [], error: false });
  });

  it('saves newest first and reads it back', () => {
    let results: GameResult[] = [];
    results = addResult(results, make(1)).results;
    results = addResult(results, make(2)).results;
    expect(results.map((r) => r.id)).toEqual(['id-2', 'id-1']);
    expect(loadHistory().results).toEqual(results);
  });

  it('keeps at most 10 results and drops the oldest', () => {
    let results: GameResult[] = [];
    for (let i = 1; i <= 11; i++) results = addResult(results, make(i)).results;
    expect(results).toHaveLength(10);
    expect(results[0].id).toBe('id-11');
    expect(results.some((r) => r.id === 'id-1')).toBe(false);
    expect(loadHistory().results).toHaveLength(10);
  });

  it('reports corrupt JSON and unknown versions without crashing', () => {
    localStorage.setItem(HISTORY_KEY, '{not json');
    expect(loadHistory()).toEqual({ results: [], error: true });
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ schemaVersion: 2, results: [] }));
    expect(loadHistory().error).toBe(true);
  });

  it('filters out invalid records', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({
        schemaVersion: 1,
        results: [
          make(1),
          { id: 'x' },
          { ...make(2), completedRounds: 11 },
          { ...make(3), finishedAt: 'nope' },
        ],
      }),
    );
    expect(loadHistory().results.map((r) => r.id)).toEqual(['id-1']);
  });

  it('reports unavailable storage on read, write and delete', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadHistory().error).toBe(true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const added = addResult([], make(1));
    expect(added.saved).toBe(false);
    expect(added.results).toHaveLength(1);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(clearHistory()).toBe(false);
  });

  it('clears saved history', () => {
    addResult([], make(1));
    expect(clearHistory()).toBe(true);
    expect(loadHistory().results).toEqual([]);
  });

  it('creates unique valid results', () => {
    const a = createResult('win', 10);
    const b = createResult('loss', 0);
    expect(a.id).not.toBe(b.id);
    expect(Number.isNaN(Date.parse(a.finishedAt))).toBe(false);
  });
});
