import { useCallback, useRef, useState } from 'react';
import {
  addResult,
  clearHistory,
  loadHistory,
  type GameResult,
} from './historyStorage';

export function useHistory() {
  const [initial] = useState(loadHistory);
  const [results, setResults] = useState<GameResult[]>(initial.results);
  const [loadError, setLoadError] = useState(initial.error);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Mirror of `results` so recording stays a plain side effect, not a state updater
  const resultsRef = useRef(results);

  const record = useCallback((result: GameResult) => {
    const next = addResult(resultsRef.current, result);
    resultsRef.current = next.results;
    setResults(next.results);
    setSaveError(!next.saved);
  }, []);

  const clear = useCallback(() => {
    if (clearHistory()) {
      resultsRef.current = [];
      setResults([]);
      setLoadError(false);
      setDeleteError(false);
      return true;
    }
    setDeleteError(true);
    return false;
  }, []);

  return { results, loadError, saveError, deleteError, record, clear };
}

export type History = ReturnType<typeof useHistory>;
