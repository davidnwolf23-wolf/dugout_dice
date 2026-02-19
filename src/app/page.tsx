"use client";

import { useEffect, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { BettingBoard } from '@/components/game/BettingBoard';
import { FieldDisplay } from '@/components/game/FieldDisplay';
import { DiceDisplay } from '@/components/game/DiceDisplay';
import { GameControls } from '@/components/game/GameControls';
import { PayoutChipDisplay, LiveBetChipAnimation } from '@/components/game/ChipAnimation';
import { DiceReferenceTable, BettingPayTable, OutcomeTable } from '@/components/game/PayoutTables';
import { BookOpen } from 'lucide-react';
import { GloveIcon, CrossedBatsIcon } from '@/components/icons/BaseballIcons';

// --- Helper Components ---
const ScoreboardPhase = ({ isPlaying, isPitching, phase }: { isPlaying: boolean, isPitching: boolean, phase: string }) => (
    <div className="text-center min-w-[70px]">
        <div className="text-[8px] uppercase text-green-300/30 font-bold tracking-wider">Phase</div>
        <div className="text-sm font-bold uppercase tracking-wider mt-0.5">
            {isPlaying ? (
                <span className="flex items-center justify-center gap-1">
                    {isPitching ? (
                        <GloveIcon size={14} className="text-blue-400" />
                    ) : (
                        <CrossedBatsIcon size={14} className="text-amber-400" />
                    )}
                    <span className={isPitching ? 'text-blue-400' : 'text-amber-400'}>{phase}</span>
                </span>
            ) : (
                <span className="text-white/20">—</span>
            )}
        </div>
    </div>
);

export default function Home() {
    const phase = useGameStore(s => s.gamePhase);
    const outs = useGameStore(s => s.outs);
    const runs = useGameStore(s => s.runs);
    const pitchingScore = useGameStore(s => s.pitchingScore);
    const lastAction = useGameStore(s => s.lastAction);
    const lastRoll = useGameStore(s => s.lastRoll);
    const lastLiveBetResult = useGameStore(s => s.lastLiveBetResult);
    const rollNumber = useGameStore(s => s.rollNumber);
    const pitchingStats = useGameStore(s => s.pitchingStats);
    const hittingStats = useGameStore(s => s.hittingStats);
    const inningHistory = useGameStore(s => s.inningHistory);
    const player = useGameStore(s => s.players[0]);

    const [showRules, setShowRules] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="min-h-screen bg-slate-900"></div>;

    const isSetup = phase === 'SETUP';
    const isPayout = phase === 'PAYOUT';
    const isPitching = phase === 'PITCHING';
    const isHitting = phase === 'HITTING';
    const isPlaying = isPitching || isHitting;

    return (
        <main className="min-h-screen bg-[#1e4d2b] text-white font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden relative">
            {/* Background Texture - Felt Pattern */}
            <div className="fixed inset-0 opacity-40 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none"></div>

            <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full h-full">
                <header className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <span className="font-black text-white text-lg leading-none">D</span>
                        </div>
                        <h1 className="text-lg font-black tracking-tight text-white/90">
                            DUGOUT <span className="text-emerald-400">DICE</span>
                        </h1>
                    </div>

                    <button
                        onClick={() => setShowRules(!showRules)}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    >
                        <BookOpen size={20} />
                    </button>
                </header>

                {/* Scoreboard Strip */}
                <div className="flex items-center justify-center gap-4 sm:gap-8 py-3 bg-black/15 border-b border-white/5 px-6">

                    {/* Phase (Left) */}
                    <ScoreboardPhase isPlaying={isPlaying} isPitching={isPitching} phase={phase} />

                    {/* Pitching Hit Tracker (left) */}
                    <div className="flex gap-1.5 items-center">
                        {[
                            { label: '1B', val: pitchingStats.singles },
                            { label: '2B', val: pitchingStats.doubles },
                            { label: '3B', val: pitchingStats.triples },
                            { label: 'HR', val: pitchingStats.hr },
                            { label: 'DP', val: pitchingStats.dp },
                            { label: 'TP', val: pitchingStats.tp },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <div className="text-[7px] uppercase text-blue-300/30 font-bold tracking-wider mb-0.5">{s.label}</div>
                                <div className="flex justify-center">
                                    <div className={`w-3 h-3 rounded-full transition-all ${s.val > 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-white/10'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Target */}
                    <div className="text-center">
                        <div className="text-[8px] uppercase text-green-300/30 font-bold tracking-wider">Target</div>
                        <div className={`text-lg sm:text-xl font-mono font-bold ${isPitching ? 'text-emerald-400' : 'text-white/40'}`}>
                            {isPitching ? runs : pitchingScore}
                        </div>
                    </div>

                    {/* Outs (Centered) */}
                    <div className="text-center px-4 border-x border-white/5">
                        <div className="text-[8px] uppercase text-green-300/30 font-bold tracking-wider mb-1">Outs</div>
                        <div className="flex gap-1.5 justify-center">
                            {[1, 2, 3].map(n => (
                                <div key={n} className={`w-3.5 h-3.5 rounded-full transition-all ${outs >= n ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-white/10'}`}></div>
                            ))}
                        </div>
                    </div>

                    {/* Points (Runs) */}
                    <div className="text-center">
                        <div className="text-[8px] uppercase text-green-300/30 font-bold tracking-wider">Points</div>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
                            {isHitting || isPayout ? runs : 0}
                        </div>
                    </div>

                    {/* Hitting Hit Tracker (right) */}
                    <div className="flex gap-1.5 items-center">
                        {[
                            { label: '1B', val: hittingStats.singles },
                            { label: '2B', val: hittingStats.doubles },
                            { label: '3B', val: hittingStats.triples },
                            { label: 'HR', val: hittingStats.hr },
                            { label: 'DP', val: hittingStats.dp },
                            { label: 'SAC', val: hittingStats.sac },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <div className="text-[7px] uppercase text-amber-300/30 font-bold tracking-wider mb-0.5">{s.label}</div>
                                <div className="flex justify-center">
                                    <div className={`w-3 h-3 rounded-full transition-all ${s.val > 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-white/10'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Phase (Right) */}
                    <ScoreboardPhase isPlaying={isPlaying} isPitching={isPitching} phase={phase} />
                </div>

                {/* === MAIN TABLE AREA === */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4 relative">

                    {/* History Tracker - Combined Left Side */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-[#1e4d2b]/80 border-2 border-amber-500/30 rounded-lg overflow-hidden backdrop-blur-sm flex flex-col items-center">
                        <div className="bg-black/20 text-center py-1 border-b border-amber-500/30 w-full">
                            <div className="font-serif italic text-amber-300/80 text-[10px] tracking-widest uppercase px-3">History</div>
                        </div>

                        <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-2">
                            {/* Headers */}
                            <div className="text-[9px] uppercase text-blue-300/60 font-serif font-bold text-center">Pitch</div>
                            <div className="text-[9px] uppercase text-amber-500/60 font-serif font-bold text-center">Hit</div>

                            {/* Rows */}
                            {inningHistory.map((h, i) => (
                                <Fragment key={i}>
                                    <div
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black font-mono transition-all
                                        ${h.winner === 'PITCHING'
                                                ? 'bg-blue-500/40 text-blue-100 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                                                : 'bg-black/40 text-white/30 border-white/10'}`}
                                    >
                                        {h.pitchingScore}
                                    </div>
                                    <div
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black font-mono transition-all
                                        ${h.winner === 'HITTING'
                                                ? 'bg-amber-500/40 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                                : 'bg-black/40 text-white/30 border-white/10'}`}
                                    >
                                        {h.hittingScore}
                                    </div>
                                </Fragment>
                            ))}

                            {/* Empty Placeholders */}
                            {Array.from({ length: Math.max(0, 10 - inningHistory.length) }).map((_, i) => (
                                <Fragment key={`empty-${i}`}>
                                    <div className="w-8 h-8 rounded-full border border-white/5 bg-black/10"></div>
                                    <div className="w-8 h-8 rounded-full border border-white/5 bg-black/10"></div>
                                </Fragment>
                            ))}
                        </div>
                    </div>

                    {/* History Tracker - Duplicate Right Side */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-[#1e4d2b]/80 border-2 border-amber-500/30 rounded-lg overflow-hidden backdrop-blur-sm flex flex-col items-center">
                        <div className="bg-black/20 text-center py-1 border-b border-amber-500/30 w-full">
                            <div className="font-serif italic text-amber-300/80 text-[10px] tracking-widest uppercase px-3">History</div>
                        </div>

                        <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-2">
                            {/* Headers */}
                            <div className="text-[9px] uppercase text-blue-300/60 font-serif font-bold text-center">Pitch</div>
                            <div className="text-[9px] uppercase text-amber-500/60 font-serif font-bold text-center">Hit</div>

                            {/* Rows */}
                            {inningHistory.map((h, i) => (
                                <Fragment key={i}>
                                    <div
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black font-mono transition-all
                                        ${h.winner === 'PITCHING'
                                                ? 'bg-blue-500/40 text-blue-100 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                                                : 'bg-black/40 text-white/30 border-white/10'}`}
                                    >
                                        {h.pitchingScore}
                                    </div>
                                    <div
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black font-mono transition-all
                                        ${h.winner === 'HITTING'
                                                ? 'bg-amber-500/40 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                                : 'bg-black/40 text-white/30 border-white/10'}`}
                                    >
                                        {h.hittingScore}
                                    </div>
                                </Fragment>
                            ))}

                            {/* Empty Placeholders */}
                            {Array.from({ length: Math.max(0, 10 - inningHistory.length) }).map((_, i) => (
                                <Fragment key={`empty-${i}`}>
                                    <div className="w-8 h-8 rounded-full border border-white/5 bg-black/10"></div>
                                    <div className="w-8 h-8 rounded-full border border-white/5 bg-black/10"></div>
                                </Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Top Outcome Table - Standard Rolls */}
                    <div className="w-full max-w-4xl mb-4">
                        <OutcomeTable />
                    </div>

                    {/* Main Content Area: Tables + Diamond */}
                    <div className="flex-1 w-full flex items-center justify-center relative">

                        {/* Left Table: Bonus Rolls */}
                        <div className="hidden xl:block absolute left-36 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 scale-90 origin-left">
                            <DiceReferenceTable />
                        </div>

                        {/* Center: Diamond + Controls */}
                        <div className="relative w-full max-w-lg z-10">
                            <FieldDisplay />

                            {/* Dice overlay on diamond */}
                            {isPlaying && lastRoll && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                    <DiceDisplay />
                                </div>
                            )}
                        </div>

                        {/* Right Table: Side Bets */}
                        <div className="hidden xl:block absolute right-36 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 scale-90 origin-right">
                            <BettingPayTable />
                        </div>
                    </div>

                    {/* Game Controls + Live Feedback */}
                    {isPlaying && (
                        <div className="flex flex-col items-center gap-2 py-4">
                            {/* Structured Feedback Area (Fixed height to prevent jumping) */}
                            <div className="flex flex-col items-center justify-center h-24 w-full">
                                {/* Hit Type (e.g. SINGLE, DOUBLE) */}
                                <div className="h-8 flex items-center justify-center">
                                    {lastAction && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            key={`action-${lastAction}-${rollNumber}`}
                                            className="text-amber-400 font-serif font-black italic tracking-[0.2em] uppercase text-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                                        >
                                            {lastAction}
                                        </motion.div>
                                    )}
                                </div>

                                {/* Chip Animation Slot */}
                                <div className="h-16 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        {lastLiveBetResult !== 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                key={`chips-${rollNumber}`}
                                            >
                                                <LiveBetChipAnimation
                                                    amount={lastLiveBetResult}
                                                    rollKey={rollNumber}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payout Result + Controls */}
                    {isPayout && (() => {
                        const isWin = runs > pitchingScore;
                        const isLoss = runs < pitchingScore;
                        const isPush = runs === pitchingScore;

                        return (
                            <div className="flex flex-col items-center gap-3">
                                <div className={`px-8 py-3 rounded-xl border backdrop-blur-sm text-center ${isWin
                                    ? 'bg-emerald-900/40 border-emerald-500/30'
                                    : isLoss
                                        ? 'bg-red-900/40 border-red-500/30'
                                        : 'bg-yellow-900/40 border-yellow-500/30'
                                    }`}>
                                    <div className={`text-3xl font-black uppercase tracking-wider ${isWin
                                        ? 'text-emerald-400'
                                        : isLoss
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                        }`}>
                                        {isWin ? '🎉 WIN' : isLoss ? 'LOSS' : 'PUSH'}
                                    </div>
                                    <div className="text-sm text-white/50 mt-1">
                                        {runs} - {pitchingScore}
                                    </div>
                                </div>
                                <PayoutChipDisplay winnings={player.winnings} />
                            </div>
                        );
                    })()}

                    {/* Setup welcome text */}
                    {isSetup && (
                        <div className="text-center">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-green-300/30 font-bold">Place your bets to begin</div>
                        </div>
                    )}
                </div>

                {/* === BOTTOM: Betting Row + Chip Tray === */}
                <div className="bg-black/20 border-t border-amber-800/20 py-4 backdrop-blur-sm">
                    <BettingBoard />
                </div>

            </div>

            {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        </main>
    );
}

const RulesModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl font-bold mb-6 text-emerald-400">How to Play Dugout Dice</h2>
            <div className="prose prose-invert prose-sm space-y-4">
                <p>
                    Players at the table pitch until they record three outs, and then its their turn to try and score more runs than the house.
                </p>

                <h3><b>Dice Rolls:</b></h3>
                <ul className="list-disc pl-5">
                    <li><b>2, 12:</b> Home Run (Runners on base Score + 1)</li>
                    <li><b>3, 11:</b> Triple (Runners on base Score)</li>
                    <li><b>4, 10:</b> Double (Runners on base Advance 2)</li>
                    <li><b>6, 8:</b> Single (Runners on base Advance 1)</li>
                    <li><b>5, 7, 9:</b> Strikeout!</li>
                </ul>

                <h3><b>Bonus Rolls — Pitching:</b></h3>
                <h3>Players can earn bonus rolls to earn a triple play or double play. These plays are triggered by a roll of three dice given certain game state conditions:</h3>
                <ul className="list-disc pl-5">
                    <li><b>Double Play:</b> With at least one runner on base and fewer than 2 outs, roll a third die, and a (6,4,3) turns a double play. Two outs are recorded and the lead runner is removed.</li>
                    <li><b>Triple Play:</b> With two runners on and 0 outs, roll a third die, and a (3,3,3) turns a triple play! Three outs are recorded and all runners are removed.</li>
                </ul>

                <h3><b>Bonus Rolls — Hitting:</b></h3>
                <h3>When hitting, runners roll a bonus die whenever there are fewer than 2 outs and at least one runner on base:</h3>
                <ul className="list-disc pl-5">
                    <li><b>Sacrifice:</b> A bonus roll of 1 results in one out advances each existing runner one base</li>
                    <li><b>Double Play:</b> A bonus roll of 6 in the same situation results in two outs and the lead runner is removed.</li>
                </ul>

                <p>
                    <b>Note:</b> If a bonus roll is earned but the event condition is not met, the hit type is determined by the first two dice only.
                </p>

                <h3><b>Inning Long Bets:</b></h3>
                <h3>These bets are placed before the inning begins, and are settled at the end of the inning.</h3>
                <ul className="list-disc pl-5">
                    <li><b>Inning Win:</b> Establish the target score when pitching, and bet whether you score more runs while hitting</li>
                    <li><b>Pitching Side Bet:</b> You bet on a strong defensive performance:
                        <ul className="list-circle pl-5 mt-1">
                            <li><i>Triple Play:</i> Pays 200 to 1!</li>
                            <li><i>Perfect Inning (3 straight strikeouts):</i> Pays 3 to 1</li>
                            <li><i>Double Play:</i> Pays 2 to 1</li>
                        </ul>
                    </li>
                    <li><b>Hitting Side Bet:</b> You bet you achieve something big while hitting:
                        <ul className="list-circle pl-5 mt-1">
                            <li><i>Grand Slam (Homerun with runners on each base):</i> Pays 40 to 1</li>
                            <li><i>Cycle (Players record each hit at least once):</i> Pays 3 to 1</li>
                            <li><i>Anytime Homerun (If grand slam or cycle do not occur):</i> Pays 1 to 1</li>
                        </ul>
                    </li>
                </ul>

                <h3><b>The Action (One-Roll Bets):</b></h3>
                <h3>These bets are placed during the inning, and are settled immediately after the roll.</h3>
                <ul className="list-disc pl-5">
                    <li><b>Strike Zone (Pitching Phase):</b> You bet the pitcher gets a strikeout, pays 3 to 2.
                        <ul className="list-circle pl-5 mt-1">
                            <li><i>Wins on:</i> Strikeouts</li>
                            <li><i>Loses on:</i> Hits</li>
                            <li><i>Pushes on:</i> Double and Triple Plays</li>
                        </ul>
                    </li>
                    <li><b>Batter Up (Hitting Phase):</b> You bet the batter gets an extra base hit.
                        <ul className="list-circle pl-5 mt-1">
                            <li><i>Wins on:</i> Double, Triple, and Homerun (2,3,4,10,11,12)</li>
                            <li><i>Loses on:</i> Outs (5,7,9)</li>
                            <li><i>Pushes on:</i> Single (6,8)</li>
                        </ul>
                    </li>
                </ul>
            </div>
            <button onClick={onClose} className="mt-8 w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold shadow-lg">Let's Play!</button>
        </div>
    </div>
);
