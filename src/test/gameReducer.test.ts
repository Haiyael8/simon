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

  it('abandon resets an active game only', () => {
    expect(gameReducer(awaiting(started()), { type: 'abandon' }).status).toBe('idle');
    expect(gameReducer(initialGameState, { type: 'abandon' })).toBe(initialGameState);
  });
});
