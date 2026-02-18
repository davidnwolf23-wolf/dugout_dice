import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';

/*
  Field geometry (viewBox 0 0 200 200):

  Home plate  = (100, 170)  — point of the foul lines
  1st base    = (155, 115)  — on the right foul line
  2nd base    = (100, 60)   — top of infield
  3rd base    = (45, 115)   — on the left foul line

  Foul lines are at ±45° from vertical through home plate.
  The HR fence is a true circular arc (90° sector) centered on home.
  Bases are offset so their edges sit on the foul lines.
*/

const HOME = { x: 100, y: 170 };
const FIRST = { x: 163, y: 107 };
const SECOND = { x: 100, y: 60 };
const THIRD = { x: 37, y: 107 };

// Elliptical fence radii — based on Desmos curve x²/c + y²/k = r² with c=2, k=3
// ry/rx ratio = √(k/c) = √(3/2) ≈ 1.225 → center field bulges out more
const FENCE_RX = 128;  // horizontal (left-right) radius
const FENCE_RY = 175;  // vertical (center-field) radius

// Foul line endpoints — extend at 45° from home plate
const FOUL_DIST = 145; // distance along foul line from home to fence
const foulLeft = {
    x: HOME.x + FOUL_DIST * Math.cos((225 * Math.PI) / 180),
    y: HOME.y + FOUL_DIST * Math.sin((225 * Math.PI) / 180),
};
const foulRight = {
    x: HOME.x + FOUL_DIST * Math.cos((315 * Math.PI) / 180),
    y: HOME.y + FOUL_DIST * Math.sin((315 * Math.PI) / 180),
};

// ViewBox dimensions (must match the SVG viewBox attribute)
const VB = { x: -15, y: -5, w: 230, h: 210 };

// Base size in viewBox units (for offset calculations)
// 28px base in a 384px container over 230-unit viewBox ≈ 16.8 units; half-extent ≈ 8
const BASE_HALF = 8;

export const FieldDisplay = () => {
    const onBase = useGameStore(state => state.onBase);
    const gamePhase = useGameStore(state => state.gamePhase);
    const isPlaying = gamePhase === 'PITCHING' || gamePhase === 'HITTING';

    return (
        <div className="relative w-full max-w-md aspect-square mx-auto rounded-xl overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="-15 -5 230 210" fill="none">
                {/* Infield dirt diamond removed */}

                {/* Foul line: Home → through 1B → outfield (left-field line) */}
                <line
                    x1={HOME.x} y1={HOME.y}
                    x2={foulLeft.x} y2={foulLeft.y}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                />

                {/* Foul line: Home → through 3B → outfield (right-field line) */}
                <line
                    x1={HOME.x} y1={HOME.y}
                    x2={foulRight.x} y2={foulRight.y}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                />

                {/* Home run fence — true 90° circular arc centered on home plate */}
                <path
                    d={`M ${foulLeft.x},${foulLeft.y} A ${FENCE_RX},${FENCE_RY} 0 0,1 ${foulRight.x},${foulRight.y}`}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="2"
                    fill="none"
                />

                {/* Outfield grass fill */}
                <path
                    d={`M ${HOME.x},${HOME.y} L ${foulLeft.x},${foulLeft.y} A ${FENCE_RX},${FENCE_RY} 0 0,1 ${foulRight.x},${foulRight.y} Z`}
                    fill="rgba(34,120,60,0.08)"
                    stroke="none"
                />
            </svg>

            {/* Bases — offset so edges align with foul lines */}
            {/* Home plate: shifted up so its bottom point sits at the foul line vertex */}
            <HomePlateBase isPlaying={isPlaying} cx={HOME.x} cy={HOME.y - BASE_HALF} />
            {/* 1B: shifted left so right edge is on the right foul line */}
            <DiamondBase cx={FIRST.x - BASE_HALF} cy={FIRST.y} label="1B" active={onBase[0]} isPlaying={isPlaying} />
            {/* 2B: centered (no foul line alignment needed) */}
            <DiamondBase cx={SECOND.x} cy={SECOND.y} label="2B" active={onBase[1]} isPlaying={isPlaying} />
            {/* 3B: shifted right so left edge is on the left foul line */}
            <DiamondBase cx={THIRD.x + BASE_HALF} cy={THIRD.y} label="3B" active={onBase[2]} isPlaying={isPlaying} />

            {/* Pitcher's mound */}
            <div
                className="absolute w-3 h-3 bg-white/15 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${((100 - VB.x) / VB.w) * 100}%`, top: `${(((HOME.y + SECOND.y) / 2 - VB.y) / VB.h) * 100}%` }}
            ></div>
        </div>
    );
};

// 1B, 2B, 3B — positioned via percentage from viewBox coords
const DiamondBase = ({ cx, cy, label, active, isPlaying }: {
    cx: number; cy: number; label: string; active: boolean; isPlaying: boolean;
}) => {
    const leftPct = `${((cx - VB.x) / VB.w) * 100}%`;
    const topPct = `${((cy - VB.y) / VB.h) * 100}%`;

    return (
        <div
            className="absolute flex flex-col items-center justify-center z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: leftPct, top: topPct }}
        >
            <motion.div
                className={`w-7 h-7 rotate-45 border-2 transition-all duration-300
                    ${active ? 'bg-yellow-400 border-yellow-500 shadow-[0_0_16px_rgba(250,204,21,0.5)]' : 'bg-white/10 border-white/20'}
                `}
                animate={{ scale: active ? 1.3 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                {active && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full flex items-center justify-center -rotate-45"
                    >
                        <span className="text-[10px]">🏃</span>
                    </motion.div>
                )}
            </motion.div>
            <span className={`text-[9px] font-bold mt-0.5 ${active ? 'text-yellow-300' : 'text-white/30'} ${!isPlaying ? 'text-white/15' : ''}`}>{label}</span>
        </div>
    );
};

// Home plate pentagon
const HomePlateBase = ({ isPlaying, cx, cy }: { isPlaying: boolean; cx: number; cy: number }) => {
    const leftPct = `${((cx - VB.x) / VB.w) * 100}%`;
    const topPct = `${((cy - VB.y) / VB.h) * 100}%`;

    return (
        <div
            className="absolute flex flex-col items-center justify-center z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: leftPct, top: topPct }}
        >
            <svg width="28" height="28" viewBox="0 0 28 28">
                <polygon
                    points="4,2 24,2 24,16 14,26 4,16"
                    fill={isPlaying ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}
                    stroke={isPlaying ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}
                    strokeWidth="1.5"
                />
            </svg>
            <span className={`text-[9px] font-bold mt-0 ${isPlaying ? 'text-white/30' : 'text-white/15'}`}>H</span>
        </div>
    );
};
