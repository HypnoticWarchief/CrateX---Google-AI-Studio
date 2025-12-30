
import React, { useState, useEffect } from 'react';
import { Play, FolderOpen, RotateCcw, AlertTriangle, Wifi, WifiOff, Activity, Settings, Disc, Smartphone, X, Zap, History, Sun, Moon, Database, Info, FileWarning, Music2, CheckCircle2, Menu, Bell, Check } from 'lucide-react';
import { getStatus, runAnalysis, commitChanges, triggerRollback, getConfig, isSimulated, resetPipeline } from '../services/api';
import { PipelineStatus, PipelineStage, DryRunConfig } from '../types';
import Stepper from './Stepper';
import Console from './Console';
import CrateIntelligence from './CrateIntelligence';
import SettingsModal from './SettingsModal';
import ExportModal from './ExportModal';
import ReviewModal from './ReviewModal';
import HistoryModal from './HistoryModal';
import ResultsView from './ResultsView';
import LibraryAnalysisModal from './LibraryAnalysisModal';
import DryRunConfigModal from './DryRunConfigModal';
import AppDrawer from './AppDrawer';

const Dashboard: React.FC = () => {
    const [status, setStatus] = useState<PipelineStatus>({
        is_running: false,
        current_stage: PipelineStage.IDLE,
        progress: 0,
        logs: [],
        stats: { planned_moves: 0, skipped_files: 0, avg_confidence: 0 },
        proposed_changes: []
    });
    
    const [path, setPath] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [backendOnline, setBackendOnline] = useState(false);
    
    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('cratex_theme');
        return saved ? saved === 'dark' : true;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('cratex_theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // Modal States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isDryRunConfigOpen, setIsDryRunConfigOpen] = useState(false);
    
    // Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    const [showMobileWarning, setShowMobileWarning] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'info'}[]>([]);

    useEffect(() => {
        getConfig().then(cfg => setPath(cfg.cwd || "/Volumes/Music/Unsorted")).catch(e => {});
        const checkScreen = () => {
            if (window.innerWidth < 1024) setShowMobileWarning(true);
            else setShowMobileWarning(false);
        };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    const [prevStage, setPrevStage] = useState(PipelineStage.IDLE);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getStatus();
                setStatus(data);
                setBackendOnline(!isSimulated());

                // Check for transition to COMPLETED to trigger notification
                if (data.current_stage === PipelineStage.COMPLETED && prevStage !== PipelineStage.COMPLETED) {
                    const isExecution = data.proposed_changes?.some(op => op.status === 'moved');
                    if (isExecution) {
                        addNotification("Library Sort Complete!", 'success');
                    } else {
                        addNotification("Dry Run Analysis Complete", 'success');
                    }
                }
                setPrevStage(data.current_stage);

            } catch (e) {
                setBackendOnline(false);
            }
        };
        const interval = setInterval(fetchStatus, 1000);
        return () => clearInterval(interval);
    }, [prevStage]); 

    const addNotification = (message: string, type: 'success' | 'info' = 'info') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // Opens configuration modal instead of running immediately
    const handleAnalyzeClick = () => {
        setIsDryRunConfigOpen(true);
    };

    // Called when user confirms config in modal
    const executeDryRun = async (config: DryRunConfig) => {
        setIsDryRunConfigOpen(false);
        setError(null);
        try { 
            await runAnalysis(path, config);
            addNotification("Analysis Started", 'info');
        } 
        catch (err: any) { setError(err.message); }
    };

    const handleCommit = async () => {
        try {
            setIsReviewOpen(false);
            await commitChanges();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRollback = async () => {
        if (!confirm("Are you sure? This will undo the last sort operation.")) return;
        try { await triggerRollback(); } 
        catch (err: any) { setError(err.message); }
    };

    const handleReset = async () => {
        try { await resetPipeline(); }
        catch (err: any) { setError(err.message); }
    }

    const isRunning = status.is_running;
    const hasAnalysis = status.proposed_changes && status.proposed_changes.length > 0;
    const isCompletedAndMoved = status.current_stage === PipelineStage.COMPLETED && status.proposed_changes?.[0]?.status === 'moved';
    const canRollback = isCompletedAndMoved;

    const MainContent = () => (
        <div className="grid grid-cols-12 gap-6 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xl transition-colors duration-300">
                    <div className="mb-6">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <FolderOpen className="w-4 h-4" /> Target Library Path
                        </label>
                        <input 
                            type="text" 
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            placeholder="/Volumes/Music/Library"
                            disabled={isRunning}
                        />
                    </div>
                    
                    {/* Main Control Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={handleAnalyzeClick}
                            disabled={isRunning || !path}
                            className={`w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                hasAnalysis 
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700' 
                                : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:opacity-90 shadow-lg'
                            }`}
                        >
                            {isRunning && !hasAnalysis ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                            {isRunning && !hasAnalysis ? 'Scanning...' : hasAnalysis ? 'Re-Scan (Dry Run)' : 'Start Dry Run'}
                        </button>

                        <button 
                            onClick={() => setIsReviewOpen(true)}
                            disabled={isRunning || !hasAnalysis}
                            className={`w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                !hasAnalysis 
                                ? 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed opacity-50' 
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                            }`}
                        >
                            {isRunning && hasAnalysis ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                            {isRunning && hasAnalysis ? 'Sorting...' : 'Execute Changes'}
                        </button>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-zinc-500">
                        <span>
                            {hasAnalysis ? `${status.proposed_changes?.length} tracks identified` : 'Ready to scan'}
                        </span>
                        {canRollback && (
                             <button onClick={handleRollback} className="text-red-500 hover:text-red-600 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Undo Last
                             </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Stepper currentStage={status.current_stage} progress={status.progress} />
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Files Scanned</h4>
                                <div className="text-3xl font-mono font-bold text-zinc-900 dark:text-white">{status.stats.planned_moves}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">AI Confidence</h4>
                                <div className="text-3xl font-mono font-bold text-red-600 dark:text-red-500">{(status.stats.avg_confidence * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px]">
                            <Console logs={status.logs} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <CrateIntelligence 
                    appStatus={status} 
                    currentPath={path}
                    onRunCommand={(cmd, args) => {
                        if (cmd === 'trigger_pipeline' || cmd === 'start_pipeline') {
                            if (args?.mode === 'execute') {
                                if (hasAnalysis) handleCommit();
                                else alert("Please run a Dry Run first.");
                            } else {
                                handleAnalyzeClick(); // Trigger config modal first
                            }
                        } else if (cmd === 'update_path' || cmd === 'set_path') {
                            if (args?.path) setPath(args.path);
                        }
                    }}
                />

                {/* Library Health Widget */}
                <div 
                    onClick={() => setIsAnalysisModalOpen(true)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-red-500/50 dark:hover:border-red-500/50 transition-all group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-500" />
                            <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-300 uppercase tracking-widest">Library Health</h3>
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Info className="w-3 h-3 text-zinc-500" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Music2 className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs text-zinc-500 font-bold">Duplicates</span>
                            </div>
                            <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Clean
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileWarning className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs text-zinc-500 font-bold">Corrupt Files</span>
                            </div>
                             <span className="text-xs font-bold text-zinc-400">0 Found</span>
                        </div>

                         <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Database className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs text-zinc-500 font-bold">Metadata</span>
                            </div>
                             <span className="text-xs font-bold text-amber-500">89% Complete</span>
                        </div>
                    </div>
                    <div className="mt-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-red-500 transition-colors">
                        Click for detailed analysis
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`${isDarkMode ? 'dark' : ''} bg-zinc-50 dark:bg-zinc-950 min-h-screen transition-colors duration-300`}>
            
            {/* Drawers & Modals */}
            <AppDrawer 
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
            />
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
            <LibraryAnalysisModal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} />
            <DryRunConfigModal isOpen={isDryRunConfigOpen} onClose={() => setIsDryRunConfigOpen(false)} onConfirm={executeDryRun} />
            <ReviewModal 
                isOpen={isReviewOpen} 
                onClose={() => setIsReviewOpen(false)} 
                onConfirm={handleCommit}
                changes={status.proposed_changes || []}
                isExecuting={isRunning && status.current_stage !== PipelineStage.COMPLETED}
            />

            {/* Notification Toasts */}
            <div className="fixed top-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
                {notifications.map(n => (
                    <div key={n.id} className="pointer-events-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300">
                        {n.type === 'success' 
                            ? <div className="bg-green-100 dark:bg-green-900/30 text-green-600 p-1.5 rounded-md"><Check className="w-4 h-4" /></div>
                            : <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-1.5 rounded-md"><Info className="w-4 h-4" /></div>
                        }
                        <span className="text-sm font-bold text-zinc-900 dark:text-white pr-2">{n.message}</span>
                    </div>
                ))}
            </div>
            
            {showMobileWarning && (
                <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 bg-zinc-900/95 backdrop-blur-md border border-red-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-bottom-10">
                    <div className="bg-red-500/10 p-2 rounded-lg flex-shrink-0"><Smartphone className="w-5 h-5 text-red-500" /></div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">Desktop Recommended</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">CrateX is optimized for desktop file management.</p>
                    </div>
                    <button onClick={() => setShowMobileWarning(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
            )}

            <div className="p-4 md:p-6 flex flex-col gap-6 font-sans">
                
                {/* Simplified Header */}
                {!isCompletedAndMoved && (
                    <header className="flex flex-row items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors duration-300">
                        {/* Logo Section */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 select-none group cursor-default">
                                <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">CRATE</span>
                                <span className="text-4xl font-black italic text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] transition-transform group-hover:-skew-x-[20deg]" style={{ transform: 'skewX(-12deg)' }}>X</span>
                            </div>
                            
                            {/* System Active Badge (Desktop) */}
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">v1.0.0</span>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 md:gap-4">
                            
                            {/* Notification Bell */}
                            <button className="relative p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                                )}
                            </button>

                            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>

                            {/* Status Indicator */}
                            <div className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-help ${backendOnline 
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                                : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                            }`}>
                                {/* Icon & Pulse */}
                                <div className="relative flex items-center justify-center">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {backendOnline 
                                        ? <Wifi className={`w-3.5 h-3.5 relative z-10 ${backendOnline ? 'text-emerald-600 dark:text-emerald-400' : ''}`} /> 
                                        : <WifiOff className={`w-3.5 h-3.5 relative z-10 ${!backendOnline ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                                    }
                                </div>

                                {/* Text Label */}
                                <div className="hidden sm:flex flex-col items-start leading-none">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Status</span>
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${backendOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {backendOnline ? 'Online' : 'Simulated'}
                                    </span>
                                </div>

                                {/* Enhanced Tooltip */}
                                <div className="absolute top-full right-0 mt-4 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
                                    <div className={`h-1.5 w-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    <div className="p-5">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className={`p-3 rounded-xl ${backendOnline ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                                {backendOnline ? <Activity className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                                                    {backendOnline ? 'System Online' : 'Simulation Mode'}
                                                </h4>
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-1">
                                                    {backendOnline ? 'Local Backend Active' : 'Browser Environment'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
                                            <p>
                                                {backendOnline 
                                                    ? "CrateX is fully connected to your local Python backend. Operations will be performed on your actual disk." 
                                                    : "You are running in a safe, browser-only environment using mock data. No real files will be moved or modified."}
                                            </p>
                                            {!backendOnline && (
                                                <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded text-[10px] border border-zinc-200 dark:border-zinc-800 font-mono text-zinc-500">
                                                    Start backend: uvicorn main:app
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

                            {/* Menu Button */}
                            <button 
                                onClick={() => setIsDrawerOpen(true)}
                                className="p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-95 group"
                            >
                                <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </header>
                )}

                {isCompletedAndMoved ? (
                    <ResultsView 
                        changes={status.proposed_changes || []}
                        stats={status.stats}
                        onReset={handleReset}
                        onRollback={handleRollback}
                    />
                ) : (
                    <MainContent />
                )}

                {error && (
                    <div className="fixed bottom-6 right-6 max-w-md bg-red-900/90 border border-red-500 p-4 rounded-xl shadow-2xl flex items-center gap-4 text-red-100 z-50 backdrop-blur-md">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                        <div className="text-xs font-medium">{error}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default Dashboard;
