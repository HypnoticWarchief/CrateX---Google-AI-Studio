import React, { useState, useEffect } from 'react';
import { Play, ShieldAlert, FolderOpen, RotateCcw, AlertTriangle } from 'lucide-react';
import { getStatus, runPipeline, triggerRollback, getConfig } from '../services/api';
import { PipelineStatus, PipelineStage } from '../types';
import Stepper from './Stepper';
import Console from './Console';

const Dashboard: React.FC = () => {
    const [status, setStatus] = useState<PipelineStatus>({
        is_running: false,
        current_stage: PipelineStage.IDLE,
        progress: 0,
        logs: [],
        stats: { planned_moves: 0, skipped_files: 0, avg_confidence: 0 }
    });
    const [path, setPath] = useState('');
    const [executeMode, setExecuteMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasKey, setHasKey] = useState(false);

    // Initial Config Load
    useEffect(() => {
        getConfig().then(cfg => {
            setHasKey(cfg.has_gemini_key);
            // Pre-fill path with current directory for demo convenience
            setPath(cfg.cwd + "/test_library"); 
        }).catch(err => console.error(err));
    }, []);

    // Polling Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        
        const fetchStatus = async () => {
            try {
                const data = await getStatus();
                setStatus(data);
            } catch (e) {
                console.error("Connection lost", e);
            }
        };

        fetchStatus(); // Initial call
        interval = setInterval(fetchStatus, 1000); // Poll every second

        return () => clearInterval(interval);
    }, []);

    const handleRun = async () => {
        setError(null);
        try {
            await runPipeline(path, executeMode);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRollback = async () => {
        if (!confirm("Are you sure you want to rollback all changes? This is reversible but takes time.")) return;
        try {
            await triggerRollback();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const isRunning = status.is_running;
    const isCompleted = status.current_stage === PipelineStage.COMPLETED;

    return (
        <div className="min-h-screen bg-slate-900 p-6 flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-end border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">CrateX</span>
                        <span className="text-slate-600 text-lg font-medium tracking-normal">v1.0.0</span>
                    </h1>
                    <p className="text-slate-400 mt-2">AI-Powered DJ Library Organizer & DSP Analyzer</p>
                </div>
                
                <div className="flex gap-4">
                     <div className={`px-4 py-2 rounded border text-sm font-bold flex items-center gap-2 ${hasKey ? 'border-green-800 bg-green-900/20 text-green-400' : 'border-red-800 bg-red-900/20 text-red-400'}`}>
                        {hasKey ? 'GEMINI API ACTIVE' : 'MISSING GEMINI KEY'}
                     </div>
                </div>
            </header>

            {/* Main Controls */}
            <section className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Path Input */}
                <div className="md:col-span-6 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" /> Target Directory
                    </label>
                    <input 
                        type="text" 
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        disabled={isRunning}
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-mono text-sm"
                        placeholder="/Users/DJ/Music/Soulseek Downloads"
                    />
                </div>

                {/* Mode Toggle */}
                <div className="md:col-span-3 flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Safety Mode
                    </label>
                    <div className="flex bg-slate-900 p-1 rounded border border-slate-700">
                        <button 
                            onClick={() => setExecuteMode(false)}
                            disabled={isRunning}
                            className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${!executeMode ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            DRY RUN
                        </button>
                        <button 
                            onClick={() => setExecuteMode(true)}
                            disabled={isRunning}
                            className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${executeMode ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            EXECUTE
                        </button>
                    </div>
                </div>

                {/* Action Button */}
                <div className="md:col-span-3 pt-6">
                    <button
                        onClick={handleRun}
                        disabled={isRunning || !path}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                        {isRunning ? (
                            <span className="animate-pulse">PROCESSING...</span>
                        ) : (
                            <>
                                <Play fill="currentColor" className="w-4 h-4" /> START PIPELINE
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-900/30 border border-red-500 text-red-200 px-6 py-4 rounded flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
                
                {/* Left: Progress Stepper */}
                <div className="lg:col-span-1">
                    <Stepper currentStage={status.current_stage} progress={status.progress} />
                </div>

                {/* Right: Console & Results */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Live Console */}
                    <div className="flex-1">
                        <Console logs={status.logs} />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-800 p-4 rounded border border-slate-700">
                            <h4 className="text-slate-400 text-xs font-bold uppercase">Moves Planned</h4>
                            <p className="text-3xl font-mono text-white mt-1">{status.stats.planned_moves}</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded border border-slate-700">
                            <h4 className="text-slate-400 text-xs font-bold uppercase">Skipped Files</h4>
                            <p className="text-3xl font-mono text-yellow-500 mt-1">{status.stats.skipped_files}</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded border border-slate-700">
                            <h4 className="text-slate-400 text-xs font-bold uppercase">AI Confidence</h4>
                            <p className="text-3xl font-mono text-green-500 mt-1">{(status.stats.avg_confidence * 100).toFixed(0)}%</p>
                        </div>
                    </div>

                    {/* Completion / Rollback Actions */}
                    {(isCompleted || status.current_stage === PipelineStage.IDLE) && (
                        <div className="flex justify-end gap-4">
                             <button 
                                onClick={handleRollback}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold rounded flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" /> EMERGENCY ROLLBACK
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;