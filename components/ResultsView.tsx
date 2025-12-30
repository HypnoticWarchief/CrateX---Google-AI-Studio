
import React, { useState, useMemo } from 'react';
import { FileOperation } from '../types';
import { CheckCircle, Folder, Music, Repeat, RotateCcw, Download, Share2, Grid, List, Search, ArrowRight, ChevronRight, ChevronDown } from 'lucide-react';

interface ResultsViewProps {
    changes: FileOperation[];
    stats: { planned_moves: number; avg_confidence: number };
    onReset: () => void;
    onRollback: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ changes, stats, onReset, onRollback }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGenre, setExpandedGenre] = useState<string | null>(null);
    
    // Group changes by the new genre folder
    const groupedByGenre = useMemo(() => {
        return changes.reduce((acc, change) => {
            const pathParts = change.destination.split('/');
            const genre = pathParts[pathParts.length - 2] || 'Uncategorized';
            if (!acc[genre]) {
                acc[genre] = [];
            }
            acc[genre].push(change);
            return acc;
        }, {} as Record<string, FileOperation[]>);
    }, [changes]);

    const sortedGenres = useMemo(() => {
        return Object.keys(groupedByGenre).sort().filter(g => 
            g.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [groupedByGenre, searchTerm]);

    const toggleGenre = (genre: string) => {
        setExpandedGenre(expandedGenre === genre ? null : genre);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 flex-1">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-xl shadow-black/5 transition-colors duration-300">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                        <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0 relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Sort Complete</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">
                            Organized <span className="text-zinc-900 dark:text-white font-bold">{stats.planned_moves}</span> tracks with <span className="text-green-600 dark:text-green-400 font-bold">{(stats.avg_confidence * 100).toFixed(0)}%</span> AI confidence.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end w-full md:w-auto">
                    <button 
                        onClick={onRollback}
                        className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-zinc-200 dark:border-zinc-700"
                    >
                        <RotateCcw className="w-4 h-4" /> Undo
                    </button>
                    <button 
                        onClick={onReset}
                        className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Repeat className="w-4 h-4" /> New Scan
                    </button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search genres..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                </div>
                <div className="flex gap-1 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-600 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-600 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                        {sortedGenres.map(genre => (
                            <div key={genre} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-red-500/50 transition-all hover:shadow-xl hover:shadow-red-500/5 flex flex-col">
                                <div 
                                    className="p-5 cursor-pointer bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950"
                                    onClick={() => toggleGenre(genre)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                                            <Folder className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
                                        </div>
                                        <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                            {groupedByGenre[genre].length}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-lg text-zinc-900 dark:text-white truncate mb-1">{genre}</h3>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {groupedByGenre[genre].length} tracks classified
                                    </p>
                                </div>
                                
                                <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">View Tracks</span>
                                    <div className={`p-1 rounded-full bg-zinc-200 dark:bg-zinc-800 transition-transform duration-300 ${expandedGenre === genre ? 'rotate-90' : ''}`}>
                                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                                    </div>
                                </div>

                                {/* Expanded List within Card */}
                                {expandedGenre === genre && (
                                    <div className="border-t border-zinc-200 dark:border-zinc-800 max-h-60 overflow-y-auto bg-zinc-50 dark:bg-black/20 p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                                        {groupedByGenre[genre].map(op => (
                                            <div key={op.id} className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 transition-colors">
                                                <Music className="w-3 h-3 flex-shrink-0 opacity-40" />
                                                <span className="truncate">{op.filename}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 pb-4">
                        {sortedGenres.map(genre => (
                            <div key={genre} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    onClick={() => toggleGenre(genre)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`transition-transform duration-200 ${expandedGenre === genre ? 'rotate-90' : ''}`}>
                                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Folder className="w-5 h-5 text-red-500" />
                                            <span className="font-bold text-zinc-900 dark:text-white">{genre}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded">
                                        {groupedByGenre[genre].length} tracks
                                    </span>
                                </div>
                                
                                {expandedGenre === genre && (
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-black/20 p-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {groupedByGenre[genre].map(op => (
                                                <div key={op.id} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-300">
                                                    <Music className="w-3 h-3 flex-shrink-0 opacity-40" />
                                                    <span className="truncate">{op.filename}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsView;
    