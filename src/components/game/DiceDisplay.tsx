import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';

// Base positions as percentages of the container (derived from FieldDisplay viewBox)
// ViewBox: (-15, -5, 230, 210)
// pct = (coord - origin) / size * 100
const BASE_ZONES = [
    { x: 50, y: 83 },   // Home plate
    { x: 74, y: 57 },   // 1st base
    { x: 50, y: 31 },   // 2nd base
    { x: 26, y: 57 },   // 3rd base
    { x: 50, y: 55 },   // Pitcher's mound
];

const DIE_SIZE_PCT = 14; // Approximate die size as % of container (w-12 ≈ 48px in ~400px container)
const MIN_DIST = DIE_SIZE_PCT + 2; // Minimum distance between die centers

function isTooClose(x: number, y: number, others: { x: number; y: number }[], minDist: number): boolean {
    return others.some(o => Math.hypot(x - o.x, y - o.y) < minDist);
}

function generateLandingPos(existingPositions: { x: number; y: number }[]): { x: number; y: number } {
    for (let attempt = 0; attempt < 50; attempt++) {
        const x = 22 + Math.random() * 56; // 22%-78%
        const y = 20 + Math.random() * 48; // 20%-68%

        // Check against bases
        if (isTooClose(x, y, BASE_ZONES, MIN_DIST)) continue;
        // Check against other dice
        if (isTooClose(x, y, existingPositions, MIN_DIST)) continue;

        return { x, y };
    }
    // Fallback: return center-ish if no good spot found
    return { x: 40 + Math.random() * 20, y: 35 + Math.random() * 20 };
}

// Hash a string to a number for deterministic randomness
function hashStr(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

// 8 throw directions: angle in degrees (where the dice come FROM)
const THROW_DIRECTIONS = [
    { angle: 225, label: 'bottom-left' },
    { angle: 180, label: 'left' },
    { angle: 135, label: 'top-left' },
    { angle: 270, label: 'bottom' },
    { angle: 315, label: 'bottom-right' },
    { angle: 0, label: 'right' },
    { angle: 45, label: 'top-right' },
    { angle: 90, label: 'top' },
];

export const DiceDisplay = () => {
    const lastRoll = useGameStore(state => state.lastRoll);
    const awaitingBonus = useGameStore(state => state.awaitingBonus);
    const inningId = useGameStore(state => state.inningId);

    // Pick a consistent throw direction for this inning
    const throwAngle = useMemo(() => {
        if (!inningId) return 225; // default bottom-left
        const idx = hashStr(inningId) % THROW_DIRECTIONS.length;
        return THROW_DIRECTIONS[idx].angle;
    }, [inningId]);

    const [displayDice, setDisplayDice] = useState<number[]>([1, 1]);
    const [showBonus, setShowBonus] = useState<number | null>(null);
    const [mainRollKey, setMainRollKey] = useState(0);
    const [bonusRollKey, setBonusRollKey] = useState(0);
    const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);

    const prevLastRoll = useRef(lastRoll);

    useEffect(() => {
        if (!lastRoll) return;

        const bonusValue = lastRoll.bonus != null
            ? (Array.isArray(lastRoll.bonus) ? lastRoll.bonus[0] : lastRoll.bonus)
            : null;

        const prevBonus = prevLastRoll.current?.bonus;
        const hadBonus = prevBonus != null;
        const hasBonus = bonusValue != null;

        const sameDice = prevLastRoll.current &&
            prevLastRoll.current.dice[0] === lastRoll.dice[0] &&
            prevLastRoll.current.dice[1] === lastRoll.dice[1] &&
            prevLastRoll.current.total === lastRoll.total;

        if (sameDice && !hadBonus && hasBonus) {
            // Bonus die arrived — keep main dice, add a bonus position
            setShowBonus(bonusValue);
            setBonusRollKey(k => k + 1);
            setPositions(prev => {
                const bonusPos = generateLandingPos(prev);
                return [...prev.slice(0, 2), bonusPos];
            });
        } else {
            // Fresh roll — generate new positions for both dice
            const pos1 = generateLandingPos([]);
            const pos2 = generateLandingPos([pos1]);
            setPositions([pos1, pos2]);
            setDisplayDice(lastRoll.dice);
            setShowBonus(bonusValue);
            setMainRollKey(k => k + 1);
            if (hasBonus) setBonusRollKey(k => k + 1);
        }

        prevLastRoll.current = lastRoll;
    }, [lastRoll]);

    return (
        <div className="relative w-full h-full">
            {/* Main dice */}
            {positions[0] && <Die value={displayDice[0]} rollKey={mainRollKey} index={0} landX={positions[0].x} landY={positions[0].y} throwAngle={throwAngle} />}
            {positions[1] && <Die value={displayDice[1]} rollKey={mainRollKey} index={1} landX={positions[1].x} landY={positions[1].y} throwAngle={throwAngle} />}

            {/* Bonus die */}
            {showBonus && positions[2] && (
                <Die value={showBonus} isBonus rollKey={bonusRollKey} index={2} landX={positions[2].x} landY={positions[2].y} throwAngle={throwAngle} />
            )}

            {/* Bonus awaiting indicator */}
            {awaitingBonus && !showBonus && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30"
                >
                    <div className="bg-yellow-900/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-yellow-500/30">
                        <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
                            Bonus Roll!
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Total display */}
            {!awaitingBonus && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30">
                    <motion.div
                        key={`total-${mainRollKey}-${bonusRollKey}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                        className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10"
                    >
                        <span className="text-base font-bold font-mono text-cyan-400">
                            Total: {(lastRoll?.total ?? 2)}
                        </span>
                        {showBonus && <span className="text-yellow-400 font-mono font-bold ml-2">(+{showBonus})</span>}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const Die = ({ value, isBonus = false, rollKey, index, landX, landY, throwAngle }: {
    value: number;
    isBonus?: boolean;
    rollKey: number;
    index: number;
    landX: number;
    landY: number;
    throwAngle: number;
}) => {
    const dotsMap: Record<number, number[]> = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8],
    };

    const dots = dotsMap[value] || [];

    const throwParams = useMemo(() => {
        // Use the inning's throw angle with a small per-die jitter
        const jitter = (Math.random() - 0.5) * 30; // ±15° variation per die
        const rad = ((throwAngle + jitter) * Math.PI) / 180;
        const dist = 250 + Math.random() * 100;
        const startOffsetX = Math.cos(rad) * dist;
        const startOffsetY = Math.sin(rad) * dist;
        const totalRotation = (720 + Math.random() * 720) * (Math.random() > 0.5 ? 1 : -1);
        return { startOffsetX, startOffsetY, totalRotation };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollKey, index, throwAngle]);

    return (
        <motion.div
            key={`${rollKey}-${index}-${isBonus ? 'b' : 'd'}`}
            initial={{
                x: throwParams.startOffsetX,
                y: throwParams.startOffsetY,
                rotate: throwParams.totalRotation,
                scale: 0.4,
                opacity: 0,
            }}
            animate={{
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1,
                opacity: 1,
            }}
            transition={{
                type: "spring",
                stiffness: 65,
                damping: 11,
                mass: 1.2,
                delay: index * 0.1,
            }}
            style={{
                position: 'absolute',
                left: `${landX}%`,
                top: `${landY}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20 + index,
            }}
            className={`
                w-12 h-12 rounded-lg flex flex-wrap content-between p-1.5
                shadow-[0_4px_0_rgba(0,0,0,0.3)]
                ${isBonus
                    ? 'bg-yellow-500 text-yellow-900 border-2 border-yellow-300'
                    : 'bg-white text-slate-900 border-2 border-slate-300'}
            `}
        >
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-0.5 pointer-events-none">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="flex items-center justify-center">
                        {dots.includes(i) && (
                            <div className={`w-2 h-2 rounded-full ${isBonus ? 'bg-yellow-900' : 'bg-slate-900'}`} />
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
