import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Player } from '@/lib/gameLogic';
import { BadgeDollarSign, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseballIcon, GloveIcon, CrossedBatsIcon, UmpireIcon, HomePlateIcon } from '@/components/icons/BaseballIcons';

export const PlayerPanel = () => {
    const players = useGameStore(state => state.players);
    const gamePhase = useGameStore(state => state.gamePhase);

    return (
        <div className="space-y-4">
            {players.map(player => (
                <PlayerCard key={player.id} player={player} gamePhase={gamePhase} />
            ))}
        </div>
    );
};

const PlayerCard = ({ player, gamePhase }: { player: Player, gamePhase: string }) => {
    const updateSingleBet = useGameStore(state => state.updateSingleBet);
    const [selectedChip, setSelectedChip] = useState(10);

    const isLivePitching = gamePhase === 'PITCHING';
    const isLiveHitting = gamePhase === 'HITTING';

    const handleBet = (betType: keyof Player['singleBets'], amount: number) => {
        const currentBet = player.singleBets[betType];
        if (player.bankroll >= amount) {
            updateSingleBet(betType, currentBet + amount);
        }
    };

    const handleClear = (betType: keyof Player['singleBets']) => {
        updateSingleBet(betType, 0);
    };

    return (
        <div className="relative rounded-[1.5rem] overflow-hidden shadow-xl border-[3px] border-amber-900/50">
            {/* Felt background */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-800 via-green-900 to-green-950"></div>
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

            <div className="relative z-10 p-4">
                {/* Player Name & Bankroll */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-600/20">
                    <div className="font-bold text-lg text-amber-300/90 tracking-wide">{player.name}</div>
                    <div className="flex items-center gap-1 text-emerald-400 font-mono text-xl">
                        <BadgeDollarSign size={18} />
                        <span>{player.bankroll.toLocaleString()}</span>
                    </div>
                </div>

                {/* Pre-game bets summary (locked, showing placed amounts) */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <LockedBetSpot Icon={BaseballIcon} label="Inning" amount={player.bets.inningWin} color="emerald" />
                    <LockedBetSpot Icon={GloveIcon} label="Defense" amount={player.bets.defenseSide} color="blue" />
                    <LockedBetSpot Icon={CrossedBatsIcon} label="Offense" amount={player.bets.offenseSide} color="amber" />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-amber-600/20"></div>
                    <span className="text-[8px] uppercase tracking-[0.2em] text-amber-400/40 font-bold">Live Bets</span>
                    <div className="flex-1 h-px bg-amber-600/20"></div>
                </div>

                {/* Live Betting Spots */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <LiveBetSpot
                        Icon={UmpireIcon}
                        label="STRIKE ZONE"
                        odds="3:2"
                        amount={player.singleBets.strikeZone}
                        active={isLivePitching}
                        selectedChip={selectedChip}
                        onBet={() => handleBet('strikeZone', selectedChip)}
                        onClear={() => handleClear('strikeZone')}
                        color="purple"
                    />
                    <LiveBetSpot
                        Icon={HomePlateIcon}
                        label="BATTER UP"
                        odds="1:1"
                        amount={player.singleBets.batterUp}
                        active={isLiveHitting}
                        selectedChip={selectedChip}
                        onBet={() => handleBet('batterUp', selectedChip)}
                        onClear={() => handleClear('batterUp')}
                        color="rose"
                    />
                </div>

                <div className="space-y-3">
                    <div className="text-center">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Select Chip</div>
                    </div>

                    {/* Chip Selector */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {[0.5, 1, 5, 10, 25, 50, 100].map(val => (
                            <button
                                key={val}
                                onClick={() => setSelectedChip(val)}
                                className={`
                                    w-9 h-9 rounded-full border-[2.5px] font-bold text-[9px] shadow-md transition-all active:scale-95 flex items-center justify-center font-mono
                                    ${val === 0.5 ? 'bg-rose-500 text-white border-rose-300' : ''}
                                    ${val === 1 ? 'bg-slate-200 text-slate-800 border-slate-400' : ''}
                                    ${val === 5 ? 'bg-orange-600 text-white border-orange-400' : ''}
                                    ${val === 10 ? 'bg-white text-slate-900 border-slate-300' : ''}
                                    ${val === 25 ? 'bg-green-600 text-white border-green-400' : ''}
                                    ${val === 50 ? 'bg-red-600 text-white border-red-400' : ''}
                                    ${val === 100 ? 'bg-blue-600 text-white border-blue-400' : ''}
                                    ${selectedChip === val ? 'ring-2 ring-amber-400 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'}
                                `}
                            >
                                {val < 1 ? `.${val.toString().split('.')[1]}` : val}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Small locked bet display for pre-game bets during gameplay
const LockedBetSpot = ({ Icon, label, amount, color }: {
    Icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
    label: string;
    amount: number;
    color: string;
}) => {
    const textColors: Record<string, string> = {
        emerald: 'text-emerald-500/60',
        blue: 'text-blue-500/60',
        amber: 'text-amber-500/60',
    };

    return (
        <div className="flex flex-col items-center gap-1 bg-black/20 rounded-lg p-2 border border-white/5">
            <Icon size={20} className={textColors[color] || 'text-slate-500'} />
            <span className="text-[8px] uppercase text-slate-500 font-bold tracking-wide">{label}</span>
            <span className="font-mono text-xs text-white/70">${amount}</span>
        </div>
    );
};

// Active live betting spot
const LiveBetSpot = ({ Icon, label, odds, amount, active, selectedChip, onBet, onClear, color }: {
    Icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
    label: string;
    odds: string;
    amount: number;
    active: boolean;
    selectedChip: number;
    onBet: () => void;
    onClear: () => void;
    color: string;
}) => {
    const colorMap: Record<string, { border: string; text: string; glow: string }> = {
        purple: { border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
        rose: { border: 'border-rose-500/50', text: 'text-rose-400', glow: 'shadow-rose-500/30' },
    };
    const colors = colorMap[color] || colorMap.purple;

    return (
        <motion.div
            whileHover={active ? { scale: 1.03 } : {}}
            whileTap={active ? { scale: 0.97 } : {}}
            onClick={active ? onBet : undefined}
            className={`
                relative rounded-xl border-2 flex flex-col items-center p-3 gap-1.5 transition-all
                ${active ? `${colors.border} bg-black/30 cursor-pointer hover:shadow-lg ${colors.glow}` : 'border-white/5 bg-black/10 opacity-35 cursor-default'}
            `}
        >
            {/* Active Pulse Indicator */}
            {active && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.6)]"></div>
            )}

            <Icon size={28} className={active ? colors.text : 'text-slate-600'} />
            <div className="text-[10px] font-black text-white/80 uppercase tracking-wider">{label}</div>
            <div className="text-[8px] font-mono text-slate-400/60">{odds}</div>

            {/* Chip area */}
            <div className="relative w-14 h-14">
                <AnimatePresence>
                    {amount > 0 ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/25 bg-black/40 flex items-center justify-center">
                                <span className="font-mono font-bold text-white text-xs">${amount}</span>
                            </div>
                            {active && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-500 z-20"
                                >
                                    <XCircle size={12} />
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/8 flex items-center justify-center">
                                <span className="text-[8px] text-white/15 uppercase font-bold">
                                    {active ? 'BET' : '—'}
                                </span>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {active && amount === 0 && (
                <div className="text-[7px] uppercase text-white/20 animate-pulse">Tap +${selectedChip}</div>
            )}
        </motion.div>
    );
};
