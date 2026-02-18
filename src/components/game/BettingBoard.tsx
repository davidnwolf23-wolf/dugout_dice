import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Player } from '@/lib/gameLogic';
import { XCircle, Play, RefreshCw, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseballIcon, GloveIcon, CrossedBatsIcon, UmpireIcon, HomePlateIcon } from '@/components/icons/BaseballIcons';

// Compact betting spot config
const ALL_SPOTS = [
    { key: 'inningWin', storeKey: 'inningWin' as keyof Player['bets'], label: 'INNING', Icon: BaseballIcon, color: 'emerald', type: 'pregame' as const },
    { key: 'defenseSide', storeKey: 'defenseSide' as keyof Player['bets'], label: 'PITCHING', Icon: GloveIcon, color: 'blue', type: 'pregame' as const },
    { key: 'offenseSide', storeKey: 'offenseSide' as keyof Player['bets'], label: 'HITTING', Icon: CrossedBatsIcon, color: 'amber', type: 'pregame' as const },
    { key: 'strikeZone', storeKey: 'strikeZone' as keyof Player['singleBets'], label: 'STRIKE', Icon: UmpireIcon, color: 'purple', type: 'live' as const, phase: 'PITCHING' },
    { key: 'batterUp', storeKey: 'batterUp' as keyof Player['singleBets'], label: 'BATTER', Icon: HomePlateIcon, color: 'rose', type: 'live' as const, phase: 'HITTING' },
];

export const BettingBoard = () => {
    const player = useGameStore(state => state.players[0]);
    const gamePhase = useGameStore(state => state.gamePhase);
    const updateBet = useGameStore(state => state.updateBet);
    const updateSingleBet = useGameStore(state => state.updateSingleBet);
    const startGame = useGameStore(state => state.startGame);
    const awaitingBonus = useGameStore(state => state.awaitingBonus);
    const isResolvingBets = useGameStore(state => state.isResolvingBets);
    const awaitingContinue = useGameStore(state => state.awaitingContinue);
    const roll = useGameStore(state => state.roll);
    const rollBonus = useGameStore(state => state.rollBonus);
    const continuePhase = useGameStore(state => state.continuePhase);
    const resetGame = useGameStore(state => state.resetGame);
    const outs = useGameStore(state => state.outs);

    const [selectedChip, setSelectedChip] = useState<number>(50);

    const totalWager = player.bets.inningWin + player.bets.defenseSide + player.bets.offenseSide;
    const isOverdraft = totalWager > player.bankroll;

    const isSetup = gamePhase === 'SETUP';
    const isPayout = gamePhase === 'PAYOUT';

    const handleSpotClick = (spot: typeof ALL_SPOTS[0]) => {
        if (isPayout) return;
        if (outs >= 3) return; // Round effectively over

        if (spot.type === 'pregame') {
            if (!isSetup) return; // locked during gameplay
            const betKey = spot.storeKey as keyof Player['bets'];
            const currentBet = player.bets[betKey];
            if (totalWager + selectedChip <= player.bankroll) {
                updateBet(betKey, currentBet + selectedChip);
            }
        } else {
            // Live bet
            if (awaitingBonus) return; // Locked during bonus roll

            const livePhaseMatch = (spot.phase === 'PITCHING' && gamePhase === 'PITCHING') ||
                (spot.phase === 'HITTING' && gamePhase === 'HITTING');
            if (!livePhaseMatch) return;
            const betKey = spot.storeKey as keyof Player['singleBets'];
            const currentBet = player.singleBets[betKey];
            if (player.bankroll >= selectedChip) {
                updateSingleBet(betKey, currentBet + selectedChip);
            }
        }
    };

    const handleClear = (e: React.MouseEvent, spot: typeof ALL_SPOTS[0]) => {
        e.stopPropagation();
        if (spot.type === 'pregame') {
            updateBet(spot.storeKey as keyof Player['bets'], 0);
        } else {
            if (awaitingBonus) return;
            updateSingleBet(spot.storeKey as keyof Player['singleBets'], 0);
        }
    };

    const getAmount = (spot: typeof ALL_SPOTS[0]): number => {
        if (spot.type === 'pregame') return player.bets[spot.storeKey as keyof Player['bets']];
        return player.singleBets[spot.storeKey as keyof Player['singleBets']];
    };

    const isSpotActive = (spot: typeof ALL_SPOTS[0]): boolean => {
        if (isPayout) return false;
        if (outs >= 3) return false;

        if (spot.type === 'pregame') return isSetup;

        // Disable live bets during bonus
        if (awaitingBonus) return false;

        return (spot.phase === 'PITCHING' && gamePhase === 'PITCHING') ||
            (spot.phase === 'HITTING' && gamePhase === 'HITTING');
    };

    return (
        <div className="w-full">
            {/* Betting Spots Row */}
            <div className="flex justify-center items-end gap-2 sm:gap-3 px-2 mb-3">
                {ALL_SPOTS.map(spot => {
                    const amount = getAmount(spot);
                    const active = isSpotActive(spot);
                    const isLiveBet = spot.type === 'live';
                    const locked = isLiveBet && awaitingBonus;

                    const colorMap: Record<string, { border: string; text: string; activeBg: string }> = {
                        emerald: { border: 'border-emerald-500/50', text: 'text-emerald-400', activeBg: 'bg-emerald-500/10' },
                        blue: { border: 'border-blue-500/50', text: 'text-blue-400', activeBg: 'bg-blue-500/10' },
                        amber: { border: 'border-amber-500/50', text: 'text-amber-400', activeBg: 'bg-amber-500/10' },
                        purple: { border: 'border-purple-500/50', text: 'text-purple-400', activeBg: 'bg-purple-500/10' },
                        rose: { border: 'border-rose-500/50', text: 'text-rose-400', activeBg: 'bg-rose-500/10' },
                    };
                    const c = colorMap[spot.color] || colorMap.emerald;

                    return (
                        <motion.div
                            key={spot.key}
                            whileHover={active ? { scale: 1.05, y: -2 } : {}}
                            whileTap={active ? { scale: 0.95 } : {}}
                            onClick={() => handleSpotClick(spot)}
                            className={`
                                relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all select-none
                                w-20 sm:w-24 h-24 sm:h-28
                                ${active ? `${c.border} ${c.activeBg} cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)]`
                                    : locked ? 'border-white/5 bg-black/20 opacity-30 grayscale cursor-not-allowed' // Specific style for locked bonus state
                                        : 'border-white/5 bg-black/10 opacity-40 cursor-default'}
                            `}
                        >
                            {/* Active indicator */}
                            {active && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_4px_rgba(74,222,128,0.6)]"></div>
                            )}

                            {/* Main Icon (Betting Target) */}
                            <div className={`mb-2 transition-transform duration-300 ${active ? c.text : 'text-slate-600 grayscale'}`}>
                                <spot.Icon size={40} className="sm:w-[48px] sm:h-[48px]" />
                            </div>

                            {/* Label */}
                            <div className={`text-[9px] font-black uppercase tracking-wider leading-tight text-center ${active ? 'text-white/90' : 'text-white/40'}`}>
                                {spot.label}
                            </div>

                            {/* Chip Overlay (Placed ON the logo/spot) */}
                            <AnimatePresence>
                                {amount > 0 && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: 180, opacity: 0 }}
                                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="absolute inset-0 flex items-center justify-center z-10"
                                    >
                                        {/* Chip Graphic */}
                                        <div className="relative hover:scale-110 transition-transform">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3px] border-dashed border-white/40 bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                                                <div className={`w-full h-full rounded-full border border-white/10 flex items-center justify-center ${amount >= 100 ? 'bg-blue-600/80 text-blue-100' :
                                                    amount >= 50 ? 'bg-red-600/80 text-red-100' :
                                                        amount >= 25 ? 'bg-green-600/80 text-green-100' :
                                                            amount >= 5 ? 'bg-orange-600/80 text-orange-100' :
                                                                amount >= 1 ? 'bg-slate-100/90 text-slate-900' :
                                                                    'bg-rose-500/90 text-rose-50'
                                                    }`}>
                                                    <span className="font-black font-mono text-[10px] sm:text-xs drop-shadow-md">
                                                        ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Clear Button (X) */}
                                            {active && (
                                                <button
                                                    onClick={(e) => handleClear(e, spot)}
                                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-500 shadow-md border border-white/20"
                                                >
                                                    <XCircle size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Chip Tray + Bankroll + Actions Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-4 lg:gap-0 px-4 w-full max-w-7xl mx-auto">

                {/* Left Action Zone */}
                <div className="flex justify-center lg:justify-start lg:pl-12 lg:-translate-y-4">
                    {!isSetup && (
                        <SideActionButton
                            gamePhase={gamePhase}
                            awaitingBonus={awaitingBonus}
                            awaitingContinue={awaitingContinue}
                            isResolvingBets={isResolvingBets}
                            onRoll={roll}
                            onRollBonus={rollBonus}
                            onContinue={continuePhase}
                            onReset={resetGame}
                        />
                    )}
                </div>

                {/* Center Zone: Bankroll + Chips */}
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                    {/* Bankroll */}
                    <div className="text-center mr-2">
                        <div className="text-[8px] uppercase text-slate-500 font-bold tracking-wider">Bank</div>
                        <div className="text-sm sm:text-base font-mono font-bold text-emerald-400">${player.bankroll.toLocaleString()}</div>
                    </div>

                    {/* Chips */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {[0.5, 1, 5, 10, 25, 50, 100].map(val => {
                            const chipColors: Record<number, string> = {
                                0.5: "bg-rose-500 border-rose-300 text-white",
                                1: "bg-slate-200 border-slate-400 text-slate-800",
                                5: "bg-orange-600 border-orange-400 text-white",
                                10: "bg-white border-slate-300 text-slate-900",
                                25: "bg-green-600 border-green-400 text-white",
                                50: "bg-red-600 border-red-400 text-white",
                                100: "bg-blue-600 border-blue-400 text-white",
                            };
                            return (
                                <button
                                    key={val}
                                    onClick={() => setSelectedChip(val)}
                                    className={`
                                        w-8 h-8 sm:w-11 sm:h-11 rounded-full border-[2.5px] shadow-[0_3px_4px_rgba(0,0,0,0.4)] flex items-center justify-center font-bold text-[8px] sm:text-[9px] font-mono transition-all transform
                                        ${chipColors[val] || "bg-slate-500"}
                                        ${selectedChip === val ? '-translate-y-2 shadow-[0_8px_8px_rgba(0,0,0,0.4)] scale-110 ring-2 ring-white/25' : 'hover:-translate-y-1'}
                                    `}
                                >
                                    <div className="w-5.5 h-5.5 sm:w-8 sm:h-8 rounded-full border border-dashed border-current/25 flex items-center justify-center">
                                        {val < 1 ? `.${val.toString().split('.')[1]}` : `$${val}`}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Wagered (setup only) */}
                    {isSetup && totalWager > 0 && (
                        <div className="text-center ml-2">
                            <div className="text-[8px] uppercase text-slate-500 font-bold tracking-wider">Bet</div>
                            <div className={`text-sm font-mono font-bold ${isOverdraft ? 'text-red-500' : 'text-yellow-400'}`}>${totalWager}</div>
                        </div>
                    )}
                </div>

                {/* Right Action Zone */}
                <div className="flex justify-center lg:justify-end lg:pr-12 lg:-translate-y-4">
                    {!isSetup && (
                        <SideActionButton
                            gamePhase={gamePhase}
                            awaitingBonus={awaitingBonus}
                            awaitingContinue={awaitingContinue}
                            isResolvingBets={isResolvingBets}
                            onRoll={roll}
                            onRollBonus={rollBonus}
                            onContinue={continuePhase}
                            onReset={resetGame}
                        />
                    )}
                </div>
            </div>

            {/* Play Ball button (setup only) */}
            {isSetup && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={startGame}
                        disabled={totalWager === 0 || isOverdraft}
                        className="bg-gradient-to-br from-green-500 to-emerald-700 hover:from-green-400 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-lg font-black italic uppercase py-3 px-14 rounded-full shadow-lg shadow-green-900/50 flex items-center gap-2 transform transition hover:-translate-y-1 active:translate-y-0 border-t border-green-300/50"
                    >
                        ⚾ Play Ball!
                    </button>
                </div>
            )}
        </div>
    );
};

const SideActionButton = ({
    gamePhase, awaitingBonus, awaitingContinue, isResolvingBets,
    onRoll, onRollBonus, onContinue, onReset
}: {
    gamePhase: string; awaitingBonus: boolean; awaitingContinue: boolean; isResolvingBets: boolean;
    onRoll: () => void; onRollBonus: () => void; onContinue: () => void; onReset: () => void;
}) => {
    let label = '';
    let onClick = onRoll;
    let Icon = Play;
    let colorClass = '';

    if (gamePhase === 'PAYOUT') {
        label = 'NEW INNING';
        onClick = onReset;
        Icon = RefreshCw;
        colorClass = 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 shadow-emerald-900/60';
    } else if (awaitingBonus) {
        label = 'BONUS!';
        onClick = onRollBonus;
        Icon = Play;
        colorClass = 'bg-purple-600 hover:bg-purple-500 border-purple-400 shadow-purple-900/60 animate-pulse';
    } else if (awaitingContinue) {
        label = 'CONTINUE';
        onClick = onContinue;
        Icon = SkipForward;
        colorClass = 'bg-amber-500 hover:bg-amber-400 border-white text-slate-900 shadow-amber-900/60 animate-pulse';
    } else {
        label = gamePhase === 'PITCHING' ? 'PITCH' : 'HIT';
        onClick = onRoll;
        Icon = Play;
        colorClass = gamePhase === 'PITCHING'
            ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 shadow-blue-900/60'
            : 'bg-amber-600 hover:bg-amber-500 border-amber-400 shadow-amber-900/60';
    }

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClick}
            disabled={isResolvingBets}
            className={`
                text-white font-black italic uppercase text-sm py-4 px-10 rounded-2xl shadow-2xl flex items-center gap-3 transform transition whitespace-nowrap
                ${isResolvingBets ? 'opacity-20 grayscale cursor-not-allowed' : `border-2 active:scale-95 ${colorClass}`}
                ${awaitingContinue ? 'text-slate-900' : 'text-white'}
            `}
        >
            <div className={`${awaitingContinue ? 'bg-black/20' : 'bg-white/30'} p-2 rounded-full`}>
                <Icon fill={awaitingContinue ? "none" : "currentColor"} size={16} />
            </div>
            {label}
        </motion.button>
    );
};
