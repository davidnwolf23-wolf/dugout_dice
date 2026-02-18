import { v4 as uuidv4 } from 'uuid';

// --- Types ---

export type GamePhase = 'SETUP' | 'PITCHING' | 'HITTING' | 'PAYOUT';

export interface Player {
  id: string; // Added ID for easier React keys
  name: string;
  bankroll: number;
  bets: {
    inningWin: number;
    defenseSide: number; // Perfect/TP/DP
    offenseSide: number; // Grand Slam/Cycle/HR
  };
  singleBets: {
    strikeZone: number; // Pitching phase bet
    batterUp: number;   // Hitting phase bet
  };
  winnings: {
    inningWin: number;
    defenseSide: number;
    offenseSide: number;
  };
}

export interface GameStats {
  runs: number;
  hits: number;
  hr: number;
  doubles: number;
  triples: number;
  singles: number;
  outs: number; // Outs in current half-inning
  dp: number; // Double plays
  tp: number; // Triple plays (defense only)
  slam: number; // Grand slams (offense only)
  sac: number; // Sacrifices (offense only)
  cycleHitTypes: Set<string>; // To track cycle: '1B', '2B', '3B', 'HR'
  logs: string[];
}

export interface GameState {
  sessionId: string;
  inningNumber: number;
  inningId: string;
  gamePhase: GamePhase;
  players: Player[];

  // Field State
  outs: number; // Current outs (0-3)
  runs: number; // Current runs in this half-inning
  onBase: [boolean, boolean, boolean]; // [1st, 2nd, 3rd]

  // Scores
  pitchingScore: number; // Target score set by defense
  hittingScore: number;  // Current score by offense (same as field runs, but kept for clarity)

  // Stats
  pitchingStats: GameStats;
  hittingStats: GameStats;

  // UI State
  rollNumber: number;
  lastRoll: { dice: number[]; total: number; bonus?: number[] } | null;
  lastAction: string | null; // e.g. "HOME RUN", "Strikeout"
  awaitingContinue: boolean; // For phase transitions
  awaitingBonus: boolean; // For manual bonus roll
  lastLiveBetResult: number; // Result of the last live bet (+win / -loss / 0)
  inningHistory: {
    inning: number;
    pitchingScore: number;
    hittingScore: number;
    winner: 'PITCHING' | 'HITTING' | 'PUSH';
  }[];
}

// --- Constants & Helpers ---

export const INITIAL_PLAYER_BANKROLL = 1000;

export const createPlayer = (index: number): Player => ({
  id: uuidv4(),
  name: `Player ${index + 1}`,
  bankroll: INITIAL_PLAYER_BANKROLL,
  bets: { inningWin: 0, defenseSide: 0, offenseSide: 0 },
  singleBets: { strikeZone: 0, batterUp: 0 },
  winnings: { inningWin: 0, defenseSide: 0, offenseSide: 0 },
});

export const rollDie = () => Math.floor(Math.random() * 6) + 1;

export const rollDice = (n: number) => {
  const dice = Array.from({ length: n }, () => rollDie());
  dice.sort((a, b) => a - b);
  return { dice, total: dice.reduce((a, b) => a + b, 0) };
};

// --- Core Logic functions (State Transitions) ---

// Helper to advance runners
// onBase: [1st, 2nd, 3rd]
// hitType: '1B' | '2B' | '3B' | 'HR'
// Returns: { newOnBase, runsScored }
export const advanceRunners = (onBase: [boolean, boolean, boolean], hitType: '1B' | '2B' | '3B' | 'HR') => {
  let runs = 0;
  let newOnBase = [...onBase] as [boolean, boolean, boolean];

  const runners = onBase.map(b => b ? 1 : 0); // numeric representation helpful?

  if (hitType === 'HR') {
    runs = 1 + onBase.filter(b => b).length;
    newOnBase = [false, false, false];
  } else if (hitType === '3B') {
    runs = onBase.filter(b => b).length;
    newOnBase = [false, false, true];
  } else if (hitType === '2B') {
    // 2nd and 3rd score. 1st scores? David's code: "runs += np.sum(st.session_state.on_base[-2:]) # 2nd/3rd score... 1st -> 3rd"
    // Actually standard baseball rules: 
    // Double scores 2nd and 3rd. 1st goes to 3rd usually.
    // David's code lines 489-492: 
    // runs += on_base[-2:] (indices 1 and 2, i.e. 2nd and 3rd base)
    // on_base becomes [0, 1, runner_1st]
    runs += (onBase[1] ? 1 : 0) + (onBase[2] ? 1 : 0);
    newOnBase = [false, true, onBase[0]];
  } else if (hitType === '1B') {
    // David's code lines 497-499:
    // runs += 3rd base
    // on_base = [1, 1st, 2nd]
    runs += (onBase[2] ? 1 : 0);
    newOnBase = [true, onBase[0], onBase[1]];
  }

  return { newOnBase, runs };
};

// ... More logic will be implemented in the store ...
