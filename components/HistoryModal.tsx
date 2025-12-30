import React, { useEffect, useState } from 'react';
import { X, History, Clock, RotateCcw, AlertTriangle, CheckCircle, FileCheck, ShieldAlert } from 'lucide-react';
import { HistoryItem } from '../types';
import { getHistory, rollbackHistoryId } from '../services/api';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [rollingBackId, setRollingBackId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setHistory(getHistory());
            setConfirmId(null);
            setError(null);
        }
    }, [isOpen]);

    const handleRollbackClick = (id: string) => {
        setConfirmId(id);
    };

    const confirmRollback = async () => {
        if (!confirmId) return;
        setRollingBackId(confirmId);
        try {
            await rollbackHistoryId(confirmId);
            setHistory(getHistory()); // Refresh list
            setConfirmId(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setRollingBackId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-300 dark:border-zinc-700">
                            <History className="w-4 h-4 text-zinc-900 dark:text-zinc-200" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Conversion History</h2>
                            <p className="text-xs text-zinc-500">Log & Rollback</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-white dark:bg-zinc-900">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg flex items-center gap-3 text-red-800 dark:text-red-200 mb-4">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {/* Confirmation Alert */}
                    {confirmId && (
                        <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-lg mb-6 animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-amber-800 dark:text-amber-200">Critical File Integrity Check</h3>
                                    <p className="text-xs text-amber-700 dark:text-amber-200/70 mt-1 leading-relaxed">
                                        Warning: If you have manually moved, renamed, or modified any files in the destination folder since this sort was performed, rolling back may result in incomplete transfers or broken file paths.
                                    </p>
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-500 mt-2">
                                        Do not proceed if you have manually organized files.
                                    </p>
                                    
                                    <div className="flex gap-3 mt-4">
                                        <button 
                                            onClick={() => setConfirmId(null)}
                                            className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={confirmRollback}
                                            disabled={!!rollingBackId}
                                            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center gap-2"
                                        >
                                            {rollingBackId ? 'Reverting...' : 'Yes, I understand. Rollback.'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {history.length === 0 && (
                        <div className="text-center py-12 text-zinc-400">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No conversion history found.</p>
                        </div>
                    )}

                    {history.map((item) => {
                        const ageMs = Date.now() - item.timestamp;
                        const isExpired = ageMs > 24 * 60 * 60 * 1000;
                        const hoursAgo = Math.floor(ageMs / (1000 * 60 * 60));
                        const minsAgo = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
                        
                        return (
                            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.status === 'rolled_back' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-500">Rolled Back</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">Active</span>
                                        )}
                                        <span className="text-xs text-zinc-500 font-mono">
                                            ID: {item.id.substring(0, 8)}
                                        </span>
                                    </div>
                                    <div className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{item.description}</div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1"><FileCheck className="w-3 h-3" /> {item.fileCount} Files</span>
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {hoursAgo}h {minsAgo}m ago</span>
                                    </div>
                                </div>

                                <div>
                                    {item.status === 'active' && (
                                        isExpired ? (
                                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                Rollback Expired (&gt;24h)
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleRollbackClick(item.id)}
                                                disabled={!!confirmId}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-all ${
                                                    confirmId 
                                                    ? 'opacity-30 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500' 
                                                    : 'bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-red-500 border border-zinc-200 dark:border-zinc-700'
                                                }`}
                                            >
                                                <RotateCcw className="w-3 h-3" /> Rollback
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;