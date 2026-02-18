import React from 'react';

// Common style for "felt" text
const FeltText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`font-serif text-amber-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] ${className}`}>
        {children}
    </div>
);

const FeltLabel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`font-sans text-[10px] uppercase tracking-widest text-white/40 font-bold ${className}`}>
        {children}
    </div>
);

const PayoutRow = ({ label, payout, subtext }: { label: string, payout: string, subtext?: string }) => (
    <div className="flex justify-between items-baseline py-0.5 group">
        <div className="text-white/70 text-xs font-serif group-hover:text-white transition-colors">{label}</div>
        <div className="text-right">
            <div className="text-amber-400 font-bold font-serif text-sm tabular-nums tracking-wide drop-shadow-sm">{payout}</div>
            {subtext && <div className="text-[9px] text-white/30 uppercase tracking-wider">{subtext}</div>}
        </div>
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <div className="text-center mb-3 relative">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
        <span className="relative bg-[#1e4d2b] px-3 font-serif italic text-amber-300/80 text-sm tracking-widest uppercase">
            {title}
        </span>
    </div>
);

// New Component for the top of the screen (Standard Pays)
// New Component for the top of the screen (Standard Outcomes)
export const OutcomeTable = () => {
    return (
        <div className="flex justify-center items-center py-2 select-none">
            <div className="flex bg-[#1e4d2b]/80 border-2 border-amber-500/30 rounded-lg overflow-hidden backdrop-blur-sm">
                <div className="text-center px-4 py-2 border-r border-amber-500/20">
                    <div className="text-amber-400 font-bold font-serif text-sm tracking-wider mb-1">HOME RUN</div>
                    <div className="text-xl sm:text-2xl text-white font-black font-mono tracking-widest leading-none">2, 12</div>
                </div>
                <div className="text-center px-4 py-2 border-r border-amber-500/20">
                    <div className="text-amber-400 font-bold font-serif text-sm tracking-wider mb-1">TRIPLE</div>
                    <div className="text-xl sm:text-2xl text-white font-black font-mono tracking-widest leading-none">3, 11</div>
                </div>
                <div className="text-center px-4 py-2 border-r border-amber-500/20">
                    <div className="text-amber-400 font-bold font-serif text-sm tracking-wider mb-1">DOUBLE</div>
                    <div className="text-xl sm:text-2xl text-white font-black font-mono tracking-widest leading-none">4, 10</div>
                </div>
                <div className="text-center px-4 py-2 border-r border-amber-500/20">
                    <div className="text-amber-400 font-bold font-serif text-sm tracking-wider mb-1">SINGLE</div>
                    <div className="text-xl sm:text-2xl text-white font-black font-mono tracking-widest leading-none">6, 8</div>
                </div>
                <div className="text-center px-4 py-2">
                    <div className="text-amber-400 font-bold font-serif text-sm tracking-wider mb-1">STRIKEOUT</div>
                    <div className="text-xl sm:text-2xl text-white font-black font-mono tracking-widest leading-none">5, 7, 9</div>
                </div>
            </div>
        </div>
    );
};

// Mini dice icon for the table
const SmallDieIcon = ({ value }: { value: number }) => {
    const dotsMap: Record<number, number[]> = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8],
    };
    const dots = dotsMap[value] || [];

    return (
        <div className="w-6 h-6 bg-white rounded border border-gray-400 flex items-center justify-center shadow-sm">
            <div className="grid grid-cols-3 grid-rows-3 w-4 h-4 gap-0.5 pointer-events-none">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="flex items-center justify-center">
                        {dots.includes(i) && (
                            <div className="w-1 h-1 rounded-full bg-black" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper for grid rows in the new design
const GridRow = ({ label, value, isLast = false }: { label: string, value: React.ReactNode, isLast?: boolean }) => (
    <div className={`flex justify-between items-center px-3 py-2 ${!isLast ? 'border-b border-amber-500/20' : ''}`}>
        <div className="text-amber-400 font-bold font-serif text-xs tracking-wider">{label}</div>
        <div className="text-white font-mono font-bold tracking-widest text-sm flex items-center gap-1.5">{value}</div>
    </div>
);

export const DiceReferenceTable = () => {
    return (
        <div className="select-none w-72">
            <div className="bg-[#1e4d2b]/80 border-2 border-amber-500/30 rounded-lg overflow-hidden backdrop-blur-sm">

                {/* Header */}
                <div className="bg-black/20 text-center py-1 border-b border-amber-500/30">
                    <div className="font-serif italic text-amber-300/80 text-xs tracking-widest uppercase">Bonus Rolls</div>
                </div>

                {/* Pitching Section */}
                <div className="bg-blue-900/20">
                    <div className="text-[10px] text-center text-blue-300/60 font-bold uppercase tracking-wider py-1 border-b border-amber-500/20 bg-black/10">Pitching</div>
                    <GridRow
                        label="TRIPLE PLAY"
                        value={
                            <>
                                <SmallDieIcon value={3} />
                                <SmallDieIcon value={3} />
                                <SmallDieIcon value={3} />
                            </>
                        }
                    />
                    <GridRow
                        label="DOUBLE PLAY"
                        value={
                            <>
                                <SmallDieIcon value={4} />
                                <SmallDieIcon value={6} />
                                <SmallDieIcon value={3} />
                            </>
                        }
                        isLast
                    />
                </div>

                {/* Hitting Section */}
                <div className="border-t border-amber-500/30 bg-amber-900/10">
                    <div className="text-[10px] text-center text-amber-300/60 font-bold uppercase tracking-wider py-1 border-b border-amber-500/20 bg-black/10">Hitting</div>
                    <GridRow
                        label="SACRIFICE"
                        value={
                            <>
                                <span className="text-[10px] text-white/50 mr-1">STRIKEOUT +</span>
                                <SmallDieIcon value={1} />
                            </>
                        }
                    />
                    <GridRow
                        label="DOUBLE PLAY"
                        value={
                            <>
                                <span className="text-[10px] text-white/50 mr-1">STRIKEOUT +</span>
                                <SmallDieIcon value={6} />
                            </>
                        }
                        isLast
                    />
                </div>
            </div>
        </div>
    );
};

export const BettingPayTable = () => {
    return (
        <div className="select-none w-72">
            <div className="bg-[#1e4d2b]/80 border-2 border-amber-500/30 rounded-lg overflow-hidden backdrop-blur-sm">

                {/* Header */}
                <div className="bg-black/20 text-center py-1 border-b border-amber-500/30">
                    <div className="font-serif italic text-amber-300/80 text-xs tracking-widest uppercase">Side Bets</div>
                </div>

                {/* Pitching Section */}
                <div className="bg-blue-900/20">
                    <div className="text-[10px] text-center text-blue-300/60 font-bold uppercase tracking-wider py-1 border-b border-amber-500/20 bg-black/10">Pitching</div>
                    <GridRow label="TRIPLE PLAY" value="200:1" />
                    <GridRow label="PERFECT INNING" value="3:1" />
                    <GridRow label="DOUBLE PLAY" value="2:1" isLast />
                </div>

                {/* Hitting Section */}
                <div className="border-t border-amber-500/30 bg-amber-900/10">
                    <div className="text-[10px] text-center text-amber-300/60 font-bold uppercase tracking-wider py-1 border-b border-amber-500/20 bg-black/10">Hitting</div>
                    <GridRow label="GRAND SLAM" value="40:1" />
                    <GridRow label="CYCLE" value="3:1" />
                    <GridRow label="HOME RUN" value="1:1" isLast />
                </div>

                {/* Live Bets Section */}
                <div className="border-t border-amber-500/30 bg-white/5">
                    <div className="text-[10px] text-center text-white/40 font-bold uppercase tracking-wider py-1 border-b border-amber-500/20 bg-black/10">Live Action</div>
                    <div className="flex justify-between items-center px-3 py-1.5 border-b border-amber-500/20">
                        <div className="text-purple-400 font-bold font-serif text-xs tracking-wider">STRIKE ZONE</div>
                        <div className="text-white font-mono font-bold tracking-widest text-xs">3:2</div>
                    </div>
                    <div className="flex justify-between items-center px-3 py-1.5">
                        <div className="text-rose-400 font-bold font-serif text-xs tracking-wider">BATTER UP</div>
                        <div className="text-white font-mono font-bold tracking-widest text-xs">1:1</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
