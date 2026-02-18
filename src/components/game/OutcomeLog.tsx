import React from 'react';
import { useGameStore } from '@/lib/store';
import { ScrollText } from 'lucide-react';

export const OutcomeLog = () => {
    const gamePhase = useGameStore(state => state.gamePhase);
    const pitchingStats = useGameStore((state) => state.pitchingStats);
    const hittingStats = useGameStore((state) => state.hittingStats);

    // Determine which logs to show
    const isPitching = gamePhase === 'PITCHING' || gamePhase === 'SETUP';
    const logs = isPitching || hittingStats.logs.length === 0 ? pitchingStats.logs : hittingStats.logs;
    const title = isPitching || hittingStats.logs.length === 0 ? 'Pitching Log' : 'Hitting Log';

    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 h-64 flex flex-col">
            <div className="flex items-center gap-2 text-slate-400 mb-2 font-bold uppercase text-xs tracking-wider border-b border-slate-700/50 pb-2">
                <ScrollText size={14} />
                <span>{title}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {logs.length === 0 && <div className="text-slate-600 italic text-sm text-center mt-10">No plays yet</div>}

                {logs.map((log, i) => (
                    <div key={i} className="text-sm font-mono text-slate-300 border-l-2 border-emerald-900 pl-2 py-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};
