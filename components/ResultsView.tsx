
import React from 'react';
import { FileOperation } from '../types';
import { CheckCircle, Folder, Music, Repeat, RotateCcw } from 'lucide-react';

interface ResultsViewProps {
    changes: FileOperation[];
    stats: { planned_moves: number; avg_confidence: number };
    onReset: () => void;
    onRollback: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ changes, stats, onReset, onRollback }) => {
    
    // Group changes by the new genre folder
    const groupedByGenre = changes.reduce((acc, change) => {
        const pathParts = change.destination.split('/');
        const genre = pathParts[pathParts.length - 2] || 'Uncategorized';
        if (!acc[genre]) {
            acc[genre] = [];
        }
        acc[genre].push(change);
        return acc;
    }, {} as Record<string, FileOperation[]>);

    const sortedGenres = Object.keys(groupedByGenre).sort();

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" />
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Sort Complete</h2>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Successfully organized <span className="text-zinc-900 dark:text-white font-bold">{stats.planned_moves}</span> tracks with an average confidence of <span className="text-green-600 dark:text-green-400 font-bold">{(stats.avg_confidence * 100).toFixed(0)}%</span>.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onRollback}
                        className="px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-700"
                    >
                        <RotateCcw className="w-4 h-4" /> Undo
                    </button>
                    <button 
                        onClick={onReset}
                        className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
                    >
                        <Repeat className="w-4 h-4" /> New Scan
                    </button>
                </div>
            </header>

            {/* Results Body */}
            <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 overflow-y-auto transition-colors duration-300">
                <div className="p-4 space-y-4">
                    {sortedGenres.map(genre => (
                        <details key={genre} className="group" open>
                            <summary className="bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-3 rounded-lg cursor-pointer flex justify-between items-center list-none select-none transition-colors">
                                <div className="flex items-center gap-3">
                                    <Folder className="w-5 h-5 text-red-500" />
                                    <span className="font-bold text-zinc-800 dark:text-white">{genre}</span>
                                </div>
                                <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold px-2 py-1 rounded-full">
                                    {groupedByGenre[genre].length} tracks
                                </span>
                            </summary>
                            <div className="pt-2 pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 transition-colors">
                                {groupedByGenre[genre].map(op => (
                                    <div key={op.id} className="flex items-center gap-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                                        <Music className="w-4 h-4 flex-shrink-0 opacity-50" />
                                        <span>{op.filename}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResultsView;
