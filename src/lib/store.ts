import { create } from 'zustand';
import { GameState, Player, GamePhase, createPlayer, INITIAL_PLAYER_BANKROLL, rollDice, rollDie, advanceRunners } from './gameLogic';
import { GameLog, sendLogsToGoogleSheet } from './googleSheetsLogger';

interface GameStore extends GameState {
    // Single Player Actions
    updatePlayerName: (name: string) => void;
    updateGoogleScriptUrl: (url: string) => void;

    // Betting
    updateBet: (betType: keyof Player['bets'], amount: number) => void;
    updateSingleBet: (betType: keyof Player['singleBets'], amount: number) => void;

    // Game Flow
    startGame: () => void; // Setup -> Pitching
    roll: () => void;
    rollBonus: () => void; // New action for manual bonus roll
    continuePhase: () => void;
    resetGame: () => void; // Payout -> Setup

    // Logging
    googleScriptUrl: string;
    logs: GameLog[];
    isResolvingBets: boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial State
    sessionId: '',
    inningNumber: 0,
    inningId: '',
    gamePhase: 'SETUP',
    players: [createPlayer(0)],
    outs: 0,
    runs: 0,
    onBase: [false, false, false],
    pitchingScore: 0,
    hittingScore: 0,
    pitchingStats: {
        runs: 0, hits: 0, hr: 0, doubles: 0, triples: 0, singles: 0,
        outs: 0, dp: 0, tp: 0, slam: 0, sac: 0, cycleHitTypes: new Set(), logs: []
    },
    hittingStats: {
        runs: 0, hits: 0, hr: 0, doubles: 0, triples: 0, singles: 0,
        outs: 0, dp: 0, tp: 0, slam: 0, sac: 0, cycleHitTypes: new Set(), logs: []
    },
    rollNumber: 0,
    lastRoll: null,
    lastAction: null,
    awaitingContinue: false,
    awaitingBonus: false,
    lastLiveBetResult: 0,
    inningHistory: [],

    googleScriptUrl: process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '',
    logs: [],
    isResolvingBets: false,

    // Actions
    updatePlayerName: (name) => set(state => ({
        players: [{ ...state.players[0], name }]
    })),

    updateGoogleScriptUrl: (url) => set({ googleScriptUrl: url }),

    updateBet: (betType, amount) => set(state => {
        if (state.awaitingContinue) return {};
        return {
            players: [{
                ...state.players[0],
                bets: { ...state.players[0].bets, [betType]: amount }
            }]
        };
    }),

    updateSingleBet: (betType, amount) => set(state => {
        if (state.awaitingContinue) return {};
        return {
            players: [{
                ...state.players[0],
                singleBets: { ...state.players[0].singleBets, [betType]: amount }
            }]
        };
    }),

    startGame: () => set(state => {
        const player = state.players[0];
        const totalWager = Object.values(player.bets).reduce((a, b) => a + b, 0);

        const newPlayer = { ...player, bankroll: player.bankroll - totalWager };

        // Generate Session ID if empty (first game)
        const sessionId = state.sessionId || crypto.randomUUID();

        return {
            sessionId,
            gamePhase: 'PITCHING',
            players: [newPlayer],
            inningNumber: state.inningNumber + 1,
            inningId: `inning-${state.inningNumber + 1}-${Date.now()}`,
            pitchingScore: 0,
            hittingScore: 0,
            runs: 0,
            outs: 0,
            onBase: [false, false, false],
            pitchingStats: { runs: 0, hits: 0, hr: 0, doubles: 0, triples: 0, singles: 0, outs: 0, dp: 0, tp: 0, slam: 0, sac: 0, cycleHitTypes: new Set<string>(), logs: [] },
            hittingStats: { runs: 0, hits: 0, hr: 0, doubles: 0, triples: 0, singles: 0, outs: 0, dp: 0, tp: 0, slam: 0, sac: 0, cycleHitTypes: new Set<string>(), logs: [] },
            rollNumber: 0,
            lastRoll: null,
            lastAction: null,
            awaitingContinue: false,
            awaitingBonus: false,
            logs: [], // Clear logs for new inning? Or keep accumulating? david_app accumulates then flushes. We'll flush at end of inning, so clear here is fine if we flushed.
        };
    }),

    roll: () => {
        const state = get();
        if (state.awaitingBonus || state.awaitingContinue || state.isResolvingBets) return;

        const { onBase, outs, gamePhase } = state;
        const currentStats = gamePhase === 'PITCHING' ? { ...state.pitchingStats } : { ...state.hittingStats };
        let { dice, total } = rollDice(2);

        // -- Bonus Roll Triggers Check --
        const runnersCount = onBase.filter(b => b).length;
        let triggerBonus = false;
        let isStrikeout = [5, 7, 9].includes(total);

        if (gamePhase === 'PITCHING') {
            if (runnersCount >= 2 && outs === 0 && dice[0] === 3 && dice[1] === 3) {
                triggerBonus = true; // Triple Play Chance
            } else if (runnersCount >= 1 && outs < 2) {
                const isDPChance = (dice[0] === 3 && dice[1] === 4) || (dice[0] === 3 && dice[1] === 6) || (dice[0] === 4 && dice[1] === 6);
                if (isDPChance) triggerBonus = true; // Double Play Chance
            }
        }

        // Hitting Bonus Trigger (After Strikeout determined)
        // Don't trigger with 2 outs — strikeout already ends the inning
        if (gamePhase === 'HITTING' && isStrikeout && outs < 2 && runnersCount >= 1) {
            triggerBonus = true;
        }

        // Logic split: If bonus triggered, pause and wait.
        if (triggerBonus) {
            currentStats.logs.unshift(`Rolled ${dice.join(',')} (Total ${total}) -> BONUS CHANCE!`);
            set({
                lastRoll: { dice, total },
                lastAction: "Roll Bonus",
                awaitingBonus: true,
                // Do NOT update outs/runs yet - wait for bonus roll outcome
                pitchingStats: gamePhase === 'PITCHING' ? currentStats : state.pitchingStats,
                hittingStats: gamePhase === 'HITTING' ? currentStats : state.hittingStats
            });
            return;
        }

        // Standard Outcome immediately
        // @ts-ignore
        const result = get()._calculateOutcome(state, dice, total, undefined);
        // @ts-ignore
        set(get()._finalizeRoll(state, result));
    },

    rollBonus: () => {
        const state = get();
        if (!state.awaitingBonus || !state.lastRoll) return;

        const b = rollDie();
        const { dice, total } = state.lastRoll;

        // This calculates the outcome (Special bonus action OR fallback to standard)
        // @ts-ignore
        const result = get()._calculateOutcome(state, dice, total, b);

        // @ts-ignore
        set(get()._finalizeRoll(state, result));
    },

    // New helper to determine action/stats
    // @ts-ignore
    _calculateOutcome: (state: GameStore, dice: number[], total: number, bonusDie?: number) => {
        const { onBase, outs, gamePhase } = state;
        const currentStats = gamePhase === 'PITCHING' ? { ...state.pitchingStats } : { ...state.hittingStats };

        let action = "";
        let newOuts = outs;
        let newOnBase = [...onBase] as [boolean, boolean, boolean];
        let runsScored = 0;
        let bonusSuccess = false;

        const runnersCount = onBase.filter(b => b).length;

        // 1. Try Bonus Outcomes First
        if (bonusDie !== undefined) {
            if (gamePhase === 'PITCHING') {
                // TP Chance: Requires (3,3) + 3
                const isTPChance = (dice[0] === 3 && dice[1] === 3); // Re-verified from lastRoll info
                if (isTPChance && bonusDie === 3) {
                    action = "TRIPLE PLAY!";
                    newOuts += 3;
                    currentStats.tp += 1;
                    bonusSuccess = true;
                } else {
                    // DP Chance
                    // Check if dice combination makes [3,4,6]
                    const allDice = [...dice, bonusDie].sort((x, y) => x - y);
                    if (allDice[0] === 3 && allDice[1] === 4 && allDice[2] === 6) {
                        action = "Double Play!";
                        newOuts += 2;
                        currentStats.dp += 1;
                        if (newOnBase[2]) newOnBase[2] = false;
                        else if (newOnBase[1]) newOnBase[1] = false;
                        else if (newOnBase[0]) newOnBase[0] = false;
                        bonusSuccess = true;
                    }
                }
            } else {
                // Hitting Phase
                if (bonusDie === 1) {
                    action = "Sacrifice";
                    if (newOnBase[2]) runsScored++;
                    newOnBase = [false, newOnBase[0], newOnBase[1]]; // Advance 1
                    currentStats.sac += 1;
                    newOuts += 1; // Out was pending from Strikeout trigger
                    bonusSuccess = true;
                } else if (bonusDie === 6) {
                    action = "Double Play";
                    newOuts += 2; // Strikeout (1) + DP (1) = 2 outs total added? 
                    currentStats.dp += 1;
                    if (newOnBase[2]) newOnBase[2] = false;
                    else if (newOnBase[1]) newOnBase[1] = false;
                    else if (newOnBase[0]) newOnBase[0] = false;
                    bonusSuccess = true;
                }
            }
        }

        // 2. If NO Bonus (or Bonus Failed), Apply Standard Rules based on TOTAL
        if (!bonusSuccess) {
            if (total === 2 || total === 12) {
                action = "HOME RUN";
                runsScored = 1 + runnersCount;
                if (runnersCount === 3) currentStats.slam += 1;
                newOnBase = [false, false, false];
                currentStats.hr += 1;
                currentStats.hits += 1;
                currentStats.cycleHitTypes.add('HR');
            } else if (total === 3 || total === 11) {
                action = "Triple";
                runsScored = runnersCount;
                newOnBase = [false, false, true];
                currentStats.triples += 1;
                currentStats.hits += 1;
                currentStats.cycleHitTypes.add('3B');
            } else if (total === 4 || total === 10) {
                action = "Double";
                if (newOnBase[2]) runsScored++;
                if (newOnBase[1]) runsScored++;
                newOnBase = [false, true, newOnBase[0]];
                currentStats.doubles += 1;
                currentStats.hits += 1;
                currentStats.cycleHitTypes.add('2B');
            } else if (total === 6 || total === 8) {
                action = "Single";
                if (newOnBase[2]) runsScored++;
                newOnBase = [true, newOnBase[0], newOnBase[1]];
                currentStats.singles += 1;
                currentStats.hits += 1;
                currentStats.cycleHitTypes.add('1B');
            } else if ([5, 7, 9].includes(total)) {
                action = "Strikeout";
                newOuts += 1;
            }
        }

        return { action, newOuts, newOnBase, runsScored, currentStats, dice, total, bonusDie };
    },

    // Helper to allow reuse between roll and rollBonus - assigned to store for internal access pattern
    // @ts-ignore
    _finalizeRoll: (state: GameStore, result: any) => {
        const { action, newOuts, newOnBase, runsScored, currentStats, dice, total, bonusDie } = result;

        // Stats Update
        let newPitchingScore = state.pitchingScore;
        let newHittingScore = state.hittingScore;
        let newRuns = state.runs + runsScored;

        if (state.gamePhase === 'PITCHING') {
            currentStats.runs = newRuns;
            newPitchingScore = newRuns;
        } else {
            currentStats.runs = newRuns;
            newHittingScore = newRuns;
        }

        const rollStr = bonusDie ? `Bonus ${bonusDie} -> ${action}` : `Rolled ${dice.join(',')} (Total ${total}) -> ${action}`;
        currentStats.logs.unshift(rollStr);

        // --- GOOGLE SHEETS LOGGING (Record Log) ---
        const player = state.players[0];
        const newLog: GameLog = {
            session_id: state.sessionId,
            inning_id: state.inningId,
            player_number: 1,
            session_inning_number: state.inningNumber,
            inning_roll_number: state.rollNumber + 1,
            game_phase: state.gamePhase === 'PITCHING' ? 'PITCHING' : 'HITTING', // Must match type exactly
            outs: state.outs, // Outs *before* this roll? david_app logs `st.session_state.outs` which is *current state*.
            // In python, it's inside `_finalizeRoll` equivalent. Wait.
            // `david_app.py`: `new_rows[i]['Outs'] = st.session_state.outs`
            // This is mapped *after* roll calculation but *before* writing?
            // Actually `st.session_state.outs` is updated in place.
            // So it logs the state *after* the roll?
            // Let's check `david_app.py` again... `newOuts += 1` then `st.session_state.outs = newOuts`.
            // So it logs the Resulting Outs?
            // Actually, standard scoring logs usually capture state *at the time of the event*.
            // If I roll a strikeout, 'Outs' might be 0 -> 1.
            // I'll log the `state.outs` (Before) or `newOuts`?
            // `david_app.py`: `st.session_state.outs` is updated *before* the logging loop if I recall correctly?
            // No, logging happens inside `process_roll` function after updates?
            // Let's stick to consistent "Snapshot of state associated with this roll".
            // Common practice: "Outs before roll" or "Outs resulting".
            // `david_app` logs `Run Total (Before)`. Explicitly says Before.
            // So I should log `state.runs` (before addition).
            // And `state.outs` (before addition)? the key just says 'Outs'.
            // I'll use `state.outs` (before) to match `Run Total (Before)`.
            run_total_before: state.runs,
            first: state.onBase[0] ? 1 : 0,
            second: state.onBase[1] ? 1 : 0,
            third: state.onBase[2] ? 1 : 0,
            inning_win_bet: player.bets.inningWin,
            pitching_side_bet: player.bets.defenseSide,
            hitting_side_bet: player.bets.offenseSide,
            strike_zone_bet: state.gamePhase === 'PITCHING' ? player.singleBets.strikeZone : 0,
            batter_up_bet: state.gamePhase === 'HITTING' ? player.singleBets.batterUp : 0,
            hit_type: action,
            timestamp: new Date().toISOString()
        };
        // ------------------------------------------

        // Handle Live Bets (track result for animation, defer bankroll change)
        let liveBetResult = 0;
        let liveBetResolved = false;
        const updatedPlayers = state.players.map(p => {
            let newBankroll = p.bankroll;
            const isPitching = state.gamePhase === 'PITCHING';
            const wager = isPitching ? p.singleBets.strikeZone : p.singleBets.batterUp;

            if (wager > 0) {
                if (state.gamePhase === 'HITTING') {
                    if (["HOME RUN", "Triple", "Double"].includes(action)) {
                        liveBetResult = wager;
                        liveBetResolved = true;
                    } else if (["Strikeout", "Double Play", "Sacrifice", "Double Play!"].includes(action)) {
                        liveBetResult = -wager;
                        liveBetResolved = true;
                    }
                } else {
                    if (action.toLowerCase().includes('strikeout')) {
                        liveBetResult = 1.5 * wager;
                        liveBetResolved = true;
                    } else if (["Single", "Double", "Triple", "HOME RUN"].includes(action)) {
                        liveBetResult = -wager;
                        liveBetResolved = true;
                    }
                }
            }

            // --- Pitching Side Bet Early Resolution ---
            if (state.gamePhase === 'PITCHING' && p.bets.defenseSide > 0) {
                const bet = p.bets.defenseSide;
                // TP just happened → 200x win
                if (action.includes('TRIPLE PLAY')) {
                    newBankroll += 200 * bet + bet; // payout + return wager
                    return { ...p, bankroll: newBankroll, bets: { ...p.bets, defenseSide: 0 }, winnings: { ...p.winnings, defenseSide: 200 * bet } };
                }
                // DP just happened → 2x win
                if (action.includes('Double Play')) {
                    newBankroll += 2 * bet + bet;
                    return { ...p, bankroll: newBankroll, bets: { ...p.bets, defenseSide: 0 }, winnings: { ...p.winnings, defenseSide: 2 * bet } };
                }
                // Hit happened and 2+ outs without a DP → lose
                if (currentStats.hits > 0 && newOuts >= 2 && currentStats.dp === 0) {
                    return { ...p, bankroll: newBankroll, bets: { ...p.bets, defenseSide: 0 }, winnings: { ...p.winnings, defenseSide: -bet } };
                }
            }

            // --- Offensive Side Bet Early Resolution (Grand Slam only) ---
            if (state.gamePhase === 'HITTING' && p.bets.offenseSide > 0) {
                const bet = p.bets.offenseSide;
                if (currentStats.slam >= 1) {
                    newBankroll += 40 * bet + bet; // 40x payout + return wager
                    return { ...p, bankroll: newBankroll, bets: { ...p.bets, offenseSide: 0 }, winnings: { ...p.winnings, offenseSide: 40 * bet } };
                }
            }

            return { ...p, bankroll: newBankroll };
        });

        // Delayed bankroll update + bet clearing for live bets (synced with chip animation)
        setTimeout(() => {
            set(s => {
                let updatedPlayers = s.players.map(p => ({
                    ...p, // Bankroll for side bets already updated in main flow? Yes, above.
                    // Wait, the main flow updated bankroll for side bets immediately?
                    // Let's check `updatedPlayers`. It handles side bets immediately.
                    // But live bets (Strike/Batter) were deferred.
                    // Wait, `updatedPlayers` variable holds the potential IMMEDIATE updates (side bets).
                    // BUT for live bets, it calculated `liveBetResult` but didn't apply it to `updatedPlayers`.
                    // Let's double check `updatedPlayers` logic...
                    // Correct: `updatedPlayers` returns `{ ...p, bankroll: newBankroll }` for side bets.
                    // For live bets, it just sets `liveBetResult` but doesn't modify bankroll in `updatedPlayers`.
                    // So `s.players` inside timeout will have the `updatedPlayers` from the immediate set?
                    // No, `s.players` inside `set(s => ...)` refers to state AT THAT MOMENT.
                    // The `_finalizeRoll` returns `players: updatedPlayers`.
                    // So state.players WILL have the side bet winnings.
                    // Now we need to apply live bet winnings on top of that.
                }));

                if (liveBetResolved) {
                    const betField = state.gamePhase === 'PITCHING' ? 'strikeZone' : 'batterUp';
                    updatedPlayers = s.players.map(p => ({
                        ...p,
                        bankroll: p.bankroll + liveBetResult,
                        singleBets: { ...p.singleBets, [betField]: 0 }
                    }));
                }

                return {
                    players: updatedPlayers,
                    isResolvingBets: false // UNLOCK
                };
            });
        }, 2000);

        // Check End of Inning / Switch Sides
        let nextAwaitingContinue = false;
        if (newOuts >= 3) {
            nextAwaitingContinue = true;
        }
        if (state.gamePhase === 'HITTING' && newRuns > state.pitchingScore) {
            nextAwaitingContinue = true;
        }

        return {
            players: updatedPlayers,
            outs: newOuts,
            onBase: newOnBase,
            runs: newRuns,
            rollNumber: state.rollNumber + 1,
            pitchingScore: newPitchingScore,
            hittingScore: newHittingScore,
            pitchingStats: state.gamePhase === 'PITCHING' ? currentStats : state.pitchingStats,
            hittingStats: state.gamePhase === 'HITTING' ? currentStats : state.hittingStats,
            lastRoll: { dice, total, bonus: bonusDie },
            lastAction: action,
            lastLiveBetResult: liveBetResult,
            awaitingContinue: nextAwaitingContinue,
            awaitingBonus: false,
            logs: [...state.logs, newLog], // Append log
            isResolvingBets: true, // ALWAYS LOCK INITIALLY
        };
    },

    continuePhase: () => set(state => {
        if (state.gamePhase === 'PITCHING') {
            // Perfect Inning resolution: if no hits, pitching side bet wins 3x
            const resolvedPlayers = state.players.map(p => {
                if (p.bets.defenseSide > 0 && state.pitchingStats.hits === 0) {
                    const bet = p.bets.defenseSide;
                    return {
                        ...p,
                        bankroll: p.bankroll + 3 * bet + bet,
                        bets: { ...p.bets, defenseSide: 0 },
                        winnings: { ...p.winnings, defenseSide: 3 * bet }
                    };
                }
                return p;
            });

            return {
                gamePhase: 'HITTING',
                players: resolvedPlayers,
                outs: 0,
                runs: 0,
                onBase: [false, false, false],
                rollNumber: 0,
                awaitingContinue: false,
                lastAction: null,
                lastRoll: null,
                lastLiveBetResult: 0, // Reset stale bet results
                hittingScore: 0,
                hittingStats: { ...state.hittingStats, runs: 0, hits: 0, logs: [] }
                // NO AUTO ROLL HERE
            };
        } else if (state.gamePhase === 'HITTING') {
            const { pitchingScore, hittingScore, players, pitchingStats, hittingStats } = state;

            // Payout Logic
            const newPlayers = players.map(p => {
                let winnings = { ...p.winnings };
                let bankroll = p.bankroll;

                // 1. Inning Win
                if (hittingScore > pitchingScore) {
                    winnings.inningWin = p.bets.inningWin;
                } else if (hittingScore < pitchingScore) {
                    winnings.inningWin = -p.bets.inningWin;
                } else {
                    winnings.inningWin = 0;
                }

                // 2. Defensive Side Bet (skip if already resolved during pitching)
                if (p.bets.defenseSide > 0) {
                    // Shouldn't reach here normally since it resolves early,
                    // but as a safety fallback
                    winnings.defenseSide = -p.bets.defenseSide;
                }

                // 3. Offensive Side Bet (skip grand slam — already resolved; evaluate remaining tiers)
                if (p.bets.offenseSide > 0) {
                    const hits = hittingStats;
                    const setHits = hits.cycleHitTypes;
                    const hasCycle = setHits.has('1B') && setHits.has('2B') && setHits.has('3B') && setHits.has('HR');

                    if (hasCycle) winnings.offenseSide = 3 * p.bets.offenseSide;
                    else if (hits.hr >= 1) winnings.offenseSide = 1 * p.bets.offenseSide;
                    else winnings.offenseSide = -p.bets.offenseSide;
                }

                const totalWager = p.bets.inningWin + p.bets.defenseSide + p.bets.offenseSide;
                bankroll += (winnings.inningWin + winnings.defenseSide + winnings.offenseSide) + totalWager;

                // Reset Live Bets
                let newSingleBets = { strikeZone: 0, batterUp: 0 };

                return { ...p, bankroll, winnings, singleBets: newSingleBets };
            });

            // Record Inning History
            const winner: 'PITCHING' | 'HITTING' | 'PUSH' = hittingScore > pitchingScore ? 'HITTING' : (hittingScore < pitchingScore ? 'PITCHING' : 'PUSH');
            const newHistory = [
                {
                    inning: state.inningNumber,
                    pitchingScore,
                    hittingScore,
                    winner
                },
                ...state.inningHistory
            ].slice(0, 10); // Keep last 10

            // --- FLUSH LOGS TO GOOGLE SHEET ---
            // Fire and forget - don't await in state update
            sendLogsToGoogleSheet(state.googleScriptUrl, state.logs);
            // ----------------------------------

            return {
                gamePhase: 'PAYOUT',
                players: newPlayers,
                awaitingContinue: false,
                pitchingStats: { singles: 0, doubles: 0, triples: 0, hr: 0, hits: 0, walks: 0, strikeouts: 0, dp: 0, tp: 0, sac: 0, slam: 0, runs: 0, outs: 0, cycleHitTypes: new Set<string>(), logs: [] },
                hittingStats: { singles: 0, doubles: 0, triples: 0, hr: 0, hits: 0, walks: 0, strikeouts: 0, dp: 0, tp: 0, sac: 0, slam: 0, runs: 0, outs: 0, cycleHitTypes: new Set<string>(), logs: [] },
                inningHistory: newHistory,
                logs: [], // Clear logs after flushing
            };
        }
        return {};
    }),

    resetGame: () => set(state => ({
        gamePhase: 'SETUP',
        outs: 0,
        runs: 0,
        pitchingScore: 0,
        hittingScore: 0,
        lastRoll: null,
        lastAction: null,
        lastLiveBetResult: 0,
        onBase: [false, false, false],
        players: state.players.map(p => ({
            ...p,
            // Keep bankroll, reset bets
            bets: { inningWin: 0, defenseSide: 0, offenseSide: 0 },
            singleBets: { strikeZone: 0, batterUp: 0 },
            winnings: { inningWin: 0, defenseSide: 0, offenseSide: 0 }
        }))
    }))
}));
