import type { ColorId } from './colors';
import { MAX_ROUNDS } from './config';

export type GameStatus =
  | 'idle'
  | 'presenting'
  | 'awaitingInput'
  | 'paused'
  | 'won'
  | 'lost';

export type GameState = {
  status: GameStatus;
  sequence: ColorId[];
  round: number;
  inputIndex: number;
  completedRounds: number;
  gameId: number;
  presentationId: number;
  // True after a fully correct round, until the next round is set up
  pendingAdvance: boolean;
};

export type GameAction =
  | { type: 'start'; firstColor: ColorId }
  | { type: 'presentationDone'; id: number }
  | { type: 'press'; color: ColorId }
  | { type: 'advanceRound'; id: number; nextColor: ColorId }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'dismiss' };

export const initialGameState: GameState = {
  status: 'idle',
  sequence: [],
  round: 1,
  inputIndex: 0,
  completedRounds: 0,
  gameId: 0,
  presentationId: 0,
  pendingAdvance: false,
};

function reset(state: GameState): GameState {
  return {
    ...initialGameState,
    gameId: state.gameId,
    presentationId: state.presentationId,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      if (state.status !== 'idle') return state;
      return {
        ...initialGameState,
        status: 'presenting',
        sequence: [action.firstColor],
        gameId: state.gameId + 1,
        presentationId: state.presentationId + 1,
      };

    case 'presentationDone':
      if (
        state.status !== 'presenting' ||
        state.pendingAdvance ||
        action.id !== state.presentationId
      ) {
        return state;
      }
      return { ...state, status: 'awaitingInput', inputIndex: 0 };

    case 'press': {
      if (state.status !== 'awaitingInput') return state;
      if (action.color !== state.sequence[state.inputIndex]) {
        return { ...state, status: 'lost', completedRounds: state.round - 1 };
      }
      if (state.inputIndex + 1 < state.sequence.length) {
        return { ...state, inputIndex: state.inputIndex + 1 };
      }
      if (state.round >= MAX_ROUNDS) {
        return { ...state, status: 'won', completedRounds: MAX_ROUNDS };
      }
      return {
        ...state,
        status: 'presenting',
        completedRounds: state.round,
        inputIndex: 0,
        pendingAdvance: true,
        presentationId: state.presentationId + 1,
      };
    }

    case 'advanceRound':
      if (
        state.status !== 'presenting' ||
        !state.pendingAdvance ||
        action.id !== state.presentationId
      ) {
        return state;
      }
      return {
        ...state,
        sequence: [...state.sequence, action.nextColor],
        round: state.round + 1,
        pendingAdvance: false,
      };

    case 'dismiss':
      if (state.status !== 'won' && state.status !== 'lost') return state;
      return reset(state);

    case 'pause':
      if (state.status !== 'presenting' && state.status !== 'awaitingInput') {
        return state;
      }
      return {
        ...state,
        status: 'paused',
        inputIndex: 0,
        // A stage cleared just before the pause is replayed in full, without a new color
        completedRounds: state.pendingAdvance ? state.round - 1 : state.completedRounds,
        pendingAdvance: false,
        presentationId: state.presentationId + 1,
      };

    case 'resume':
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'presenting',
        inputIndex: 0,
        presentationId: state.presentationId + 1,
      };
  }
}
