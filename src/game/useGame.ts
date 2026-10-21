import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ColorId } from './colors';
import {
  GAP_MS,
  LIGHT_MS,
  LOSS_DELAY_MS,
  MAX_ROUNDS,
  MIN_PRESS_MS,
  NEXT_ROUND_MS,
  PRE_PRESENT_MS,
  ROUND_DONE_MS,
  WIN_DELAY_MS,
} from './config';
import { gameReducer, initialGameState } from './gameReducer';
import { randomColor } from './random';
import { playLoss, playWin, startTone, stopAll, unlockAudio } from './audio';

// Resolves true after the delay, or false if aborted first
function wait(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(false);
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve(true);
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [litColor, setLitColor] = useState<ColorId | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const stateRef = useRef(state);
  const resultVisibleRef = useRef(false);
  useEffect(() => {
    stateRef.current = state;
    resultVisibleRef.current = resultVisible;
  }, [state, resultVisible]);

  const press = useRef<{ stop: () => void; startedAt: number; timer?: number } | null>(
    null,
  );

  const releasePress = useCallback(() => {
    const current = press.current;
    if (!current) return;
    window.clearTimeout(current.timer);
    current.stop();
    press.current = null;
    setLitColor(null);
  }, []);

  // Sequence presentation: one run per presentationId, fully cancelable
  useEffect(() => {
    if (state.status !== 'presenting') return;
    const id = state.presentationId;
    const abort = new AbortController();
    const { signal } = abort;
    let stopTone: (() => void) | null = null;

    const run = async () => {
      if (stateRef.current.pendingAdvance) {
        if (!(await wait(ROUND_DONE_MS, signal))) return;
        dispatch({ type: 'advanceRound', id, nextColor: randomColor() });
        if (!(await wait(NEXT_ROUND_MS, signal))) return;
      } else if (!(await wait(PRE_PRESENT_MS, signal))) {
        return;
      }

      const sequence = stateRef.current.sequence;
      for (let i = 0; i < sequence.length; i++) {
        setLitColor(sequence[i]);
        stopTone = startTone(sequence[i]);
        const lit = await wait(LIGHT_MS, signal);
        stopTone();
        stopTone = null;
        setLitColor(null);
        if (!lit) return;
        if (i < sequence.length - 1 && !(await wait(GAP_MS, signal))) return;
      }
      dispatch({ type: 'presentationDone', id });
    };
    void run();

    return () => {
      abort.abort();
      stopTone?.();
      setLitColor(null);
    };
  }, [state.status, state.presentationId]);

  // Result message and end sound appear after a fixed delay (the result itself is already final)
  useEffect(() => {
    if (state.status !== 'won' && state.status !== 'lost') return;
    const won = state.status === 'won';
    const timer = window.setTimeout(
      () => {
        setResultVisible(true);
        if (won) playWin();
        else playLoss();
      },
      won ? WIN_DELAY_MS : LOSS_DELAY_MS,
    );
    return () => {
      window.clearTimeout(timer);
      setResultVisible(false);
    };
  }, [state.status]);

  useEffect(
    () => () => {
      stopAll();
    },
    [],
  );

  const startGame = useCallback(async () => {
    const ok = await unlockAudio();
    setAudioError(!ok);
    if (ok) dispatch({ type: 'start', firstColor: randomColor() });
  }, []);

  const pressStart = useCallback((color: ColorId) => {
    const s = stateRef.current;
    if (s.status !== 'awaitingInput' || press.current) return;
    press.current = { stop: startTone(color), startedAt: Date.now() };
    setLitColor(color);
    dispatch({ type: 'press', color });
  }, []);

  // Light and sound last at least MIN_PRESS_MS, or as long as the finger stays down
  const pressEnd = useCallback(() => {
    const current = press.current;
    if (!current || current.timer !== undefined) return;
    const remaining = MIN_PRESS_MS - (Date.now() - current.startedAt);
    if (remaining <= 0) releasePress();
    else current.timer = window.setTimeout(releasePress, remaining);
  }, [releasePress]);

  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);

  // Freezes an active game; finished or unstarted games are left alone
  const pauseGame = useCallback(() => {
    const status = stateRef.current.status;
    if (status !== 'presenting' && status !== 'awaitingInput') return;
    releasePress();
    stopAll();
    dispatch({ type: 'pause' });
  }, [releasePress]);

  // Leaving Home: pause, and drop an end message that was already on screen
  const leaveGame = useCallback(() => {
    pauseGame();
    if (resultVisibleRef.current) dispatch({ type: 'dismiss' });
  }, [pauseGame]);

  const resuming = useRef(false);
  const resumeGame = useCallback(async () => {
    if (stateRef.current.status !== 'paused' || resuming.current) return;
    resuming.current = true;
    try {
      const ok = await unlockAudio();
      setAudioError(!ok);
      if (ok) dispatch({ type: 'resume' });
    } finally {
      resuming.current = false;
    }
  }, []);

  // Hiding the app pauses the game; coming back does nothing on its own
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pauseGame();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', pauseGame);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', pauseGame);
    };
  }, [pauseGame]);

  return {
    state,
    litColor,
    resultVisible,
    audioError,
    startGame,
    pressStart,
    pressEnd,
    dismiss,
    leaveGame,
    resumeGame,
    maxRounds: MAX_ROUNDS,
  };
}
