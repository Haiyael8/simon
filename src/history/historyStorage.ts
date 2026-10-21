export type GameResult = {
  id: string;
  finishedAt: string; // ISO 8601
  completedRounds: number; // 0-10
  outcome: 'win' | 'loss';
};

type HistoryData = {
  schemaVersion: 1;
  results: GameResult[];
};

export const HISTORY_KEY = 'simon.history.v1';
export const MAX_HISTORY = 10;

function isValidResult(value: unknown): value is GameResult {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.finishedAt === 'string' &&
    !Number.isNaN(Date.parse(r.finishedAt)) &&
    typeof r.completedRounds === 'number' &&
    Number.isInteger(r.completedRounds) &&
    r.completedRounds >= 0 &&
    r.completedRounds <= 10 &&
    (r.outcome === 'win' || r.outcome === 'loss')
  );
}

function write(results: GameResult[]): boolean {
  try {
    const data: HistoryData = { schemaVersion: 1, results };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// A missing key is an empty history, not an error
export function loadHistory(): { results: GameResult[]; error: boolean } {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (raw === null) return { results: [], error: false };
    const data: unknown = JSON.parse(raw);
    if (
      typeof data !== 'object' ||
      data === null ||
      (data as HistoryData).schemaVersion !== 1 ||
      !Array.isArray((data as HistoryData).results)
    ) {
      return { results: [], error: true };
    }
    const results = (data as HistoryData).results
      .filter(isValidResult)
      .slice(0, MAX_HISTORY);
    return { results, error: false };
  } catch {
    return { results: [], error: true };
  }
}

export function createResult(
  outcome: GameResult['outcome'],
  completedRounds: number,
): GameResult {
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
    finishedAt: new Date().toISOString(),
    completedRounds,
    outcome,
  };
}

// Newest first, capped at MAX_HISTORY; `saved` is false when storage rejected the write
export function addResult(
  current: GameResult[],
  result: GameResult,
): { results: GameResult[]; saved: boolean } {
  const results = [result, ...current].slice(0, MAX_HISTORY);
  return { results, saved: write(results) };
}

export function clearHistory(): boolean {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}
