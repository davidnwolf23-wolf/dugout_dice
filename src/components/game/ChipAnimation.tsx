import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHIP_COLORS = [
    'bg-red-500 border-red-300',
    'bg-blue-500 border-blue-300',
    'bg-green-500 border-green-300',
    'bg-purple-500 border-purple-300',
    'bg-yellow-500 border-yellow-300',
];

export const ChipAnimation = ({ amount, label, delay = 0 }: {
    amount: number;
    label: string;
    delay?: number;
}) => {
    const isWin = amount > 0;
    const isLoss = amount < 0;
    const absAmount = Math.abs(amount);

    const chips = useMemo(() => {
        if (amount === 0) return [];
        const count = Math.min(Math.max(Math.ceil(absAmount / 25), 2), 8);
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            color: CHIP_COLORS[i % CHIP_COLORS.length],
            offsetX: (i - count / 2) * 22 + (Math.random() - 0.5) * 10,
            rotation: (Math.random() - 0.5) * 30,
            delay: delay + i * 0.07,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amount, delay]);

    if (amount === 0) return null;

    return (
        <div className="flex flex-col items-center gap-1">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.2, duration: 0.3 }}
                className="text-center"
            >
                <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
                <div className={`text-lg font-black font-mono ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isWin ? '+' : ''}{amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
            </motion.div>

            <div className="relative h-14 w-56 flex items-center justify-center">
                {chips.map(chip => (
                    <motion.div
                        key={chip.id}
                        initial={{
                            y: isWin ? -300 : 0,
                            x: isWin ? 0 : chip.offsetX,
                            opacity: isWin ? 0 : 1,
                            scale: 0.5,
                            rotate: chip.rotation * 3,
                        }}
                        animate={{
                            y: isLoss ? -300 : 0,
                            x: chip.offsetX,
                            opacity: isLoss ? 0 : 1,
                            scale: 1,
                            rotate: chip.rotation,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 80,
                            damping: 12,
                            delay: chip.delay,
                        }}
                        className={`
                            absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] shadow-[0_3px_4px_rgba(0,0,0,0.4)]
                            flex items-center justify-center
                            ${chip.color}
                        `}
                    >
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-dashed border-current/25 flex items-center justify-center">
                            <span className="text-[9px] sm:text-[10px] font-bold font-mono text-white/80">$</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/** Shows all payout animations for the end of an inning */
export const PayoutChipDisplay = ({ winnings }: {
    winnings: { inningWin: number; defenseSide: number; offenseSide: number };
}) => {
    const bets = [
        { key: 'inningWin', label: 'Inning Bet', amount: winnings.inningWin, delay: 0 },
        { key: 'defenseSide', label: 'Pitching Side', amount: winnings.defenseSide, delay: 0.5 },
        { key: 'offenseSide', label: 'Hitting Side', amount: winnings.offenseSide, delay: 1.0 },
    ].filter(b => b.amount !== 0);

    if (bets.length === 0) return null;

    return (
        <div className="flex gap-6 justify-center flex-wrap">
            <AnimatePresence>
                {bets.map(bet => (
                    <ChipAnimation
                        key={bet.key}
                        amount={bet.amount}
                        label={bet.label}
                        delay={bet.delay}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

/** Compact chip animation for per-roll live bet results */
export const LiveBetChipAnimation = ({ amount, rollKey }: { amount: number; rollKey: number }) => {
    const isWin = amount > 0;
    const isLoss = amount < 0;

    const chips = useMemo(() => {
        if (amount === 0) return [];
        const count = Math.min(Math.max(Math.ceil(Math.abs(amount) / 50), 1), 3);
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            color: CHIP_COLORS[i % CHIP_COLORS.length],
            offsetX: (i - (count - 1) / 2) * 20,
            delay: i * 0.06,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amount, rollKey]);

    if (amount === 0) return null;

    return (
        <motion.div
            key={`live-${rollKey}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mt-1"
        >
            <div className="relative h-14 w-24 flex items-center justify-center overflow-visible">
                {chips.map(chip => (
                    <motion.div
                        key={`${rollKey}-${chip.id}`}
                        initial={isWin
                            ? { y: -400, opacity: 0, scale: 0.4 }
                            : { y: 0, opacity: 0, scale: 1 }
                        }
                        animate={isWin
                            ? {
                                y: [-400, 0, 0, 0],
                                opacity: [0, 1, 1, 0],
                                scale: [0.4, 1, 1, 0.8],
                            }
                            : {
                                y: [0, 0, 0, -600],
                                opacity: [0, 1, 1, 0],
                                scale: [1, 1, 1, 0.5],
                            }
                        }
                        transition={isWin
                            ? {
                                duration: 3,
                                times: [0, 0.25, 0.75, 1],
                                ease: ["easeOut", "linear", "easeIn"],
                                delay: 1.0 + chip.delay,
                            }
                            : {
                                duration: 2.5,
                                times: [0, 0.15, 0.4, 1],
                                ease: ["easeOut", "linear", "easeIn"],
                                delay: 1.0 + chip.delay,
                            }
                        }
                        className={`absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] shadow-[0_3px_4px_rgba(0,0,0,0.4)] flex items-center justify-center ${chip.color}`}
                        style={{ left: `calc(50% + ${chip.offsetX}px - 20px)` }}
                    >
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-dashed border-current/25 flex items-center justify-center">
                            <span className="text-[9px] sm:text-[10px] font-bold font-mono text-white/80">$</span>
                        </div>
                    </motion.div>
                ))}
            </div>
            <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={isWin
                    ? { opacity: [0, 1, 1, 0], x: [-5, 0, 0, 0] }
                    : { opacity: [0, 1, 1, 0], x: [-5, 0, 0, 0] }
                }
                transition={isWin
                    ? { duration: 3, times: [0, 0.15, 0.75, 1], delay: 1.0 }
                    : { duration: 2.5, times: [0, 0.1, 0.6, 1], delay: 1.0 }
                }
                className={`text-base font-black font-mono ${isWin ? 'text-emerald-400' : 'text-red-400'}`}
            >
                {isWin ? '+' : ''}{amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </motion.span>
        </motion.div>
    );
};
