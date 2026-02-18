import React from 'react';
import { useGameStore } from '@/lib/store';
import { Play, SkipForward, RefreshCw } from 'lucide-react';

export const GameControls = () => {
    const gamePhase = useGameStore(state => state.gamePhase);
    const roll = useGameStore(state => state.roll);
    const rollBonus = useGameStore(state => state.rollBonus);
    const continuePhase = useGameStore(state => state.continuePhase);
    const awaitingContinue = useGameStore(state => state.awaitingContinue);
    const awaitingBonus = useGameStore(state => state.awaitingBonus);
    const isResolvingBets = useGameStore(state => state.isResolvingBets);
    const resetGame = useGameStore(state => state.resetGame);

    if (gamePhase === 'SETUP') return null;

    if (gamePhase === 'PAYOUT') {
        return (
            <div className="flex justify-center p-4">
                <button
                    onClick={resetGame}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 transform transition active:scale-95"
                >
                    <RefreshCw size={20} />
                    Start New Inning
                </button>
            </div>
        );
    }

    if (awaitingBonus) {
        return (
            <div className="flex justify-center items-center gap-4 p-4">
                <button
                    onClick={rollBonus}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl py-4 px-12 rounded-2xl shadow-xl border-t border-purple-400 flex items-center gap-3 transform transition active:scale-95 animate-pulse"
                >
                    <div className="bg-white/20 p-2 rounded-full">
                        <Play fill="currentColor" size={24} />
                    </div>
                    ROLL BONUS!
                </button>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center gap-4 p-4">
            {!awaitingContinue ? (
                <button
                    onClick={roll}
                    disabled={isResolvingBets}
                    className={`
                        text-white font-bold text-xl py-4 px-12 rounded-2xl shadow-xl flex items-center gap-3 transform transition 
                        ${isResolvingBets
                            ? 'bg-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 border-t border-blue-400 active:scale-95'}
                    `}
                >
                    <div className="bg-white/20 p-2 rounded-full">
                        <Play fill="currentColor" size={24} />
                    </div>
                    {gamePhase === 'PITCHING' ? 'PITCH' : 'HIT'}
                </button>
            ) : (
                <button
                    onClick={continuePhase}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xl py-4 px-12 rounded-2xl shadow-xl border-t border-amber-300 flex items-center gap-3 transform transition active:scale-95 animate-pulse"
                >
                    <SkipForward size={24} />
                    CONTINUE
                </button>
            )}
        </div>
    );
};
