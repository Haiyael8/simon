import { gameReducer, initialGameState, type GameState } from '../game/gameReducer';
import type { ColorId } from '../game/colors';

function started(first: ColorId = 'green'): GameState {
  return gameReducer(initialGameState, { type: 'start', firstColor: first });
}

function awaiting(state: GameState): GameState {
  return gameReducer(state, { type: 'presentationDone', id: state.presentationId });
}

// Plays a full round correctly and sets up the next one, returning the awaiting state
function clearRound(state: GameState, nextColor: ColorId): GameState {
  let s = state;
  for (const color of state.sequence) s = gameReducer(s, { type: 'press', color });
  s = gameReducer(s, { type: 'advanceRound', id: s.presentationId, nextColor });
  return awaiting(s);
}

describe('gameReducer', () => {
  it('starts with a one-color sequence at round 1', () => {
    const s = started('red');
    expect(s.status).toBe('presenting');
    expect(s.sequence).toEqual(['red']);
    expect(s.round).toBe(1);
    expect(s.completedRounds).toBe(0);
    expect(s.gameId).toBe(1);
  });

  it('ignores start unless idle', () => {
    const s = started();
    expect(gameReducer(s, { type: 'start', firstColor: 'blue' })).toBe(s);
  });

  it('grows the sequence by exactly one color per round, keeping the prefix (repeats allowed)', () => {
    let s = awaiting(started('green'));
    s = clearRound(s, 'green');
    expect(s.sequence).toEqual(['green', 'green']);
    expect(s.round).toBe(2);
    s = clearRound(s, 'blue');
    expect(s.sequence).toEqual(['green', 'green', 'blue']);
  });

  it('reaches a ten-color sequence at round 10', () => {
    let s = awaiting(started('red'));
    for (let i = 0; i < 9; i++) s = clearRound(s, 'yellow');
    expect(s.round).toBe(10);
    expect(s.sequence).toHaveLength(10);
  });

  it('loses on the first press of round 1 with 0 completed rounds', () => {
    const s = gameReducer(awaiting(started('green')), { type: 'press', color: 'red' });
    expect(s.status).toBe('lost');
    expect(s.completedRounds).toBe(0);
  });

  it('loses in a later round with round - 1 completed', () => {
    let s = awaiting(started('green'));
    for (let i = 0; i < 4; i++) s = clearRound(s, 'green');
    expect(s.round).toBe(5);
    s = gameReducer(s, { type: 'press', color: 'red' });
    expect(s.status).toBe('lost');
    expect(s.completedRounds).toBe(4);
  });

  it('loses on a wrong press in the middle of a sequence', () => {
    let s = awaiting(started('green'));
    s = clearRound(s, 'red');
    s = gameReducer(s, { type: 'press', color: 'green' });
    expect(s.inputIndex).toBe(1);
    s = gameReducer(s, { type: 'press', color: 'blue' });
    expect(s.status).toBe('lost');
    expect(s.completedRounds).toBe(1);
  });

  it('wins after completing round 10 and never creates round 11', () => {
    let s = awaiting(started('green'));
    for (let i = 0; i < 9; i++) s = clearRound(s, 'green');
    for (const color of s.sequence) s = gameReducer(s, { type: 'press', color });
    expect(s.status).toBe('won');
    expect(s.completedRounds).toBe(10);
    expect(s.round).toBe(10);
    expect(s.sequence).toHaveLength(10);
    expect(
      gameReducer(s, { type: 'advanceRound', id: s.presentationId, nextColor: 'red' }),
    ).toBe(s);
  });

  it('ignores presses outside awaitingInput', () => {
    const presenting = started('green');
    expect(gameReducer(presenting, { type: 'press', color: 'green' })).toBe(presenting);
    expect(gameReducer(initialGameState, { type: 'press', color: 'green' })).toBe(
      initialGameState,
    );
    const lost = gameReducer(awaiting(started('green')), { type: 'press', color: 'red' });
    expect(gameReducer(lost, { type: 'press', color: 'green' })).toBe(lost);
  });

  it('ignores stale presentationDone and advanceRound', () => {
    const s = started('green');
    expect(gameReducer(s, { type: 'presentationDone', id: s.presentationId - 1 })).toBe(s);
    const cleared = gameReducer(awaiting(s), { type: 'press', color: 'green' });
    expect(cleared.pendingAdvance).toBe(true);
    expect(
      gameReducer(cleared, {
        type: 'advanceRound',
        id: cleared.presentationId - 1,
        nextColor: 'red',
      }),
    ).toBe(cleared);
    expect(
      gameReducer(cleared, { type: 'presentationDone', id: cleared.presentationId }),
    ).toBe(cleared);
  });

  it('dismiss returns to idle and keeps the game id', () => {
    const lost = gameReducer(awaiting(started('green')), { type: 'press', color: 'red' });
    const idle = gameReducer(lost, { type: 'dismiss' });
    expect(idle.status).toBe('idle');
    expect(idle.round).toBe(1);
    expect(idle.sequence).toEqual([]);
    expect(idle.gameId).toBe(lost.gameId);
    expect(gameReducer(started(), { type: 'dismiss' }).status).toBe('presenting');
  });

  it('pause keeps sequence and round, drops partial input, and invalidates the presentation', () => {
    let s = awaiting(started('green'));
    s = clearRound(s, 'red');
    s = gameReducer(s, { type: 'press', color: 'green' });
    expect(s.inputIndex).toBe(1);
    const paused = gameReducer(s, { type: 'pause' });
    expect(paused.status).toBe('paused');
    expect(paused.sequence).toEqual(['green', 'red']);
    expect(paused.round).toBe(2);
    expect(paused.inputIndex).toBe(0);
    expect(paused.completedRounds).toBe(1);
    expect(paused.presentationId).toBe(s.presentationId + 1);
    expect(gameReducer(paused, { type: 'presentationDone', id: s.presentationId })).toBe(paused);
    expect(gameReducer(paused, { type: 'press', color: 'green' })).toBe(paused);
  });

  it('pause applies only to presenting or awaitingInput', () => {
    expect(gameReducer(started(), { type: 'pause' }).status).toBe('paused');
    expect(gameReducer(initialGameState, { type: 'pause' })).toBe(initialGameState);
    const lost = gameReducer(awaiting(started('green')), { type: 'press', color: 'red' });
    expect(gameReducer(lost, { type: 'pause' })).toBe(lost);
    const paused = gameReducer(started(), { type: 'pause' });
    expect(gameReducer(paused, { type: 'pause' })).toBe(paused);
  });

  it('pause right after a cleared stage replays that stage without a new color', () => {
    const cleared = gameReducer(awaiting(started('green')), { type: 'press', color: 'green' });
    expect(cleared.pendingAdvance).toBe(true);
    const paused = gameReducer(cleared, { type: 'pause' });
    expect(paused.pendingAdvance).toBe(false);
    expect(paused.completedRounds).toBe(0);
    expect(paused.sequence).toEqual(['green']);
    expect(paused.round).toBe(1);
  });

  it('resume re-presents the same stage and sequence with a new presentation id', () => {
    const paused = gameReducer(clearRound(awaiting(started('green')), 'red'), { type: 'pause' });
    const resumed = gameReducer(paused, { type: 'resume' });
    expect(resumed.status).toBe('presenting');
    expect(resumed.sequence).toEqual(['green', 'red']);
    expect(resumed.round).toBe(2);
    expect(resumed.inputIndex).toBe(0);
    expect(resumed.presentationId).toBe(paused.presentationId + 1);
    expect(gameReducer(resumed, { type: 'resume' })).toBe(resumed);
    expect(gameReducer(initialGameState, { type: 'resume' })).toBe(initialGameState);
  });
});
