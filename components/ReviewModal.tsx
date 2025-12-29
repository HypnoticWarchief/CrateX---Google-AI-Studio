
import React from 'react';
import { X, ArrowRight, FileAudio, FolderInput, FolderOutput, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FileOperation } from '../types';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    changes: FileOperation[];
    isExecuting: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onConfirm, changes, isExecuting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-500" /> 
                            Confirm Changes
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">
                            Review the sorting plan before moving files
                        </p>
                    </div>
                    <button onClick={onClose} disabled={isExecuting} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body (Scrollable List) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50 dark:bg-zinc-900/50">
                    {changes.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <p>No changes detected.</p>
                        </div>
                    )}
                    {changes.map((op) => (
                        <div key={op.id} className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-4 group hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-sm">
                            
                            {/* Source */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <FolderInput className="w-3 h-3 text-zinc-400" />
                                    <div className="text-xs text-zinc-500 truncate dir-rtl" title={op.source}>
                                        {op.source.replace(op.filename, '')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-300">
                                    <FileAudio className="w-4 h-4 text-red-500" />
                                    <span className="truncate">{op.filename}</span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center justify-center text-zinc-400">
                                <ArrowRight className="w-5 h-5 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                            </div>

                            {/* Destination */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <FolderOutput className="w-3 h-3 text-green-500" />
                                    <div className="text-xs text-green-600 dark:text-green-400/70 truncate dir-rtl" title={op.destination}>
                                        {op.destination.replace(op.filename, '')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
                                    <span className="truncate">{op.filename}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                                    {op.reason}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 text-amber-600 dark:text-amber-500/80 bg-amber-50 dark:bg-amber-900/10 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-900/20">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold">Files will be moved permanently. Rollback available.</span>
                    </div>
                    <div className="flex gap-3 ml-auto">
                        <button 
                            onClick={onClose}
                            disabled={isExecuting}
                            className="px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={isExecuting}
                            className="px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-widest bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                        >
                            {isExecuting ? 'Sorting...' : `Confirm & Move ${changes.length} Files`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
