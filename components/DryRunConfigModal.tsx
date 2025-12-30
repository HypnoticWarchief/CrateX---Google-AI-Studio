
import React, { useState, useEffect } from 'react';
import { X, Play, Sliders, Layers, Cpu, Zap, Clock, Info } from 'lucide-react';
import { DryRunConfig } from '../types';

interface DryRunConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: DryRunConfig) => void;
    estimatedFiles?: number;
}

const DryRunConfigModal: React.FC<DryRunConfigModalProps> = ({ isOpen, onClose, onConfirm, estimatedFiles = 2850 }) => {
    const [batchSize, setBatchSize] = useState(20);
    const [workers, setWorkers] = useState(4);
    const [smartFanOut, setSmartFanOut] = useState(true);
    const [estimatedTime, setEstimatedTime] = useState(0);

    // Calculate estimated time on change
    useEffect(() => {
        // Base time per file approx 150ms in simulation/mock calculation
        // Real time would depend on network/disk.
        // Formula: (Files / (Workers * 2)) * BatchFactor
        
        // Simplified estimate for UI feedback:
        // More workers = faster
        // Larger batches = slightly faster (less overhead)
        
        const efficiency = 1 + (workers * 0.15); 
        const rawTimeSeconds = (estimatedFiles * 0.1) / efficiency;
        setEstimatedTime(Math.max(5, Math.ceil(rawTimeSeconds)));
    }, [batchSize, workers, estimatedFiles]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700">
                            <Sliders className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Dry Run Config</h2>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Parallel Execution Settings</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
                    
                    {/* Batch Size Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Batch Size
                            </label>
                            <span className="text-zinc-900 dark:text-white font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">
                                {batchSize} files
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            step="10" 
                            value={batchSize} 
                            onChange={(e) => setBatchSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(220,38,38,0.5)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                        />
                        <p className="text-xs text-zinc-400">Larger batches reduce API overhead but consume more memory.</p>
                    </div>

                    {/* Workers Slider */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> Parallel Workers
                            </label>
                            <span className="text-zinc-900 dark:text-white font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">
                                {workers} threads
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="16" 
                            step="1" 
                            value={workers} 
                            onChange={(e) => setWorkers(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(220,38,38,0.5)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                        />
                         <p className="text-xs text-zinc-400">Fan-out tagging across multiple CPU cores for speed.</p>
                    </div>

                    {/* Smart Fan-Out Toggle */}
                    <div 
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${smartFanOut ? 'bg-white dark:bg-zinc-800/50 border-red-500 shadow-lg shadow-red-500/10' : 'bg-transparent border-zinc-200 dark:border-zinc-700'}`}
                        onClick={() => setSmartFanOut(!smartFanOut)}
                    >
                         <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${smartFanOut ? 'bg-red-500 border-red-500' : 'border-zinc-400'}`}>
                            {smartFanOut && <Zap className="w-3.5 h-3.5 text-white fill-current" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                Smart Fan-Out <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 px-1.5 rounded uppercase">Recommended</span>
                            </h4>
                            <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">
                                Automatically distributes API calls to avoid rate limits while maximizing throughput.
                            </p>
                        </div>
                    </div>

                    {/* Estimate */}
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                        <Clock className="w-5 h-5 text-zinc-400" />
                        <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase">Estimated Duration</div>
                            <div className="text-lg font-black text-zinc-900 dark:text-white">~{estimatedTime} Seconds</div>
                        </div>
                        <div className="ml-auto text-xs text-zinc-400 text-right">
                             Based on {estimatedFiles} files<br/>
                             @ {batchSize} batch size
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 items-center">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-md font-bold text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm({ batchSize, workers, smartFanOut })}
                        className="px-5 py-2 rounded-md font-bold text-[11px] uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                        <Play className="w-3 h-3 fill-current" /> Start Scan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DryRunConfigModal;
