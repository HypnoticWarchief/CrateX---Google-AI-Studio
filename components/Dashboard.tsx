
import React, { useState, useEffect, useRef } from 'react';
import { Play, FolderOpen, RotateCcw, AlertTriangle, Wifi, WifiOff, Activity, Settings, Disc, Smartphone, X, Zap, History, Sun, Moon, Database, Info, FileWarning, Music2, CheckCircle2, Menu, Bell, Check, HelpCircle, StopCircle } from 'lucide-react';
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
import OnboardingTour, { TourStep } from './OnboardingTour';

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
    
    // Notifications tracking
    const hasNotifiedRef = useRef(false);
    const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'info'}[]>([]);

    // Tour State
    const [isTourOpen, setIsTourOpen] = useState(false);

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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showMobileWarning, setShowMobileWarning] = useState(false);

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

    // Auto-dismiss mobile warning after 8 seconds
    useEffect(() => {
        if (showMobileWarning) {
            const timer = setTimeout(() => setShowMobileWarning(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [showMobileWarning]);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getStatus();
                
                // Detection logic for completion notification
                if (data.current_stage === PipelineStage.COMPLETED && !hasNotifiedRef.current) {
                    const isExecution = data.proposed_changes?.some(op => op.status === 'moved');
                    if (isExecution) {
                        addNotification("Library Sort Complete!", 'success');
                    } else if (data.proposed_changes && data.proposed_changes.length > 0) {
                        addNotification("Dry Run Analysis Complete", 'success');
                    }
                    hasNotifiedRef.current = true;
                }

                // Reset notification flag if we go from idle/completed to running
                if (data.is_running) {
                    hasNotifiedRef.current = false;
                }

                setStatus(data);
                setBackendOnline(!isSimulated());
            } catch (e) {
                setBackendOnline(false);
            }
        };
        const interval = setInterval(fetchStatus, 1000);
        return () => clearInterval(interval);
    }, []); 

    const addNotification = (message: string, type: 'success' | 'info' = 'info') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const handleAnalyzeClick = () => {
        setIsDryRunConfigOpen(true);
    };

    const executeDryRun = async (config: DryRunConfig) => {
        setIsDryRunConfigOpen(false);
        setError(null);
        hasNotifiedRef.current = false; // Reset explicitly
        try { 
            await runAnalysis(path, config);
            addNotification("Analysis Started", 'info');
        } 
        catch (err: any) { setError(err.message); }
    };

    const handleCommit = async () => {
        try {
            setIsReviewOpen(false);
            hasNotifiedRef.current = false; // Reset explicitly
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

    const TOUR_STEPS: TourStep[] = [
        {
            targetId: 'tour-path-input',
            title: 'Select Your Library',
            description: 'Enter the folder path where your messy music files are located. We recommend using a copy of your library for the first run.',
            position: 'bottom'
        },
        {
            targetId: 'tour-analyze-btn',
            title: 'Start a Dry Run',
            description: 'Always run a Scan first. This simulates the sorting process using AI without actually moving any files, so you can review the results.',
            position: 'top'
        },
        {
            targetId: 'tour-console',
            title: 'Live Matrix Console',
            description: 'Watch the system logs in real-time. You will see AI decision-making and file operations happen here.',
            position: 'right'
        },
        {
            targetId: 'tour-agent',
            title: 'AI Copilot',
            description: 'Chat with CrateX to find purchase links, create Spotify playlists, or ask questions about your library.',
            position: 'left'
        },
        {
            targetId: 'tour-status',
            title: 'System Status',
            description: 'Check if you are running in "Simulation Mode" (browser only) or "Online" (connected to Python backend).',
            position: 'bottom'
        }
    ];

    const MainContent = () => (
        <div className="grid grid-cols-12 gap-6 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xl transition-colors duration-300">
                    <div className="mb-6">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <FolderOpen className="w-4 h-4" /> Target Library Path
                        </label>
                        <div className="flex gap-2">
                            <input 
                                id="tour-path-input"
                                type="text" 
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="flex-1 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                placeholder="/Volumes/Music/Library"
                                disabled={isRunning}
                            />
                            <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors">
                                Browse
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* START/ABORT LOGIC: If running, show Abort. If not running, show Start/Re-Scan */}
                        {isRunning ? (
                             <button 
                                onClick={handleReset}
                                className="w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-2 border-transparent hover:border-red-500 transition-all flex items-center justify-center gap-3 animate-pulse"
                            >
                                <StopCircle className="w-5 h-5 fill-current" />
                                Abort Operation
                            </button>
                        ) : (
                            <button 
                                id="tour-analyze-btn"
                                onClick={handleAnalyzeClick}
                                disabled={!path}
                                className={`w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                    hasAnalysis 
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700' 
                                    : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black hover:opacity-90 shadow-lg'
                                }`}
                            >
                                <Play className="w-5 h-5 fill-current" />
                                {hasAnalysis ? 'Re-Scan (Dry Run)' : 'Start Dry Run'}
                            </button>
                        )}

                        <button 
                            onClick={() => setIsReviewOpen(true)}
                            disabled={isRunning || !hasAnalysis}
                            className={`w-full py-4 rounded-lg font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                !hasAnalysis 
                                ? 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed opacity-50' 
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                            }`}
                        >
                            <Zap className="w-5 h-5 fill-current" />
                            Execute Changes
                        </button>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-zinc-500">
                        <span>
                            {isRunning ? (
                                <span className="text-red-500 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Process Running...
                                </span>
                            ) : (
                                hasAnalysis ? `${status.proposed_changes?.length} tracks identified` : 'Ready to scan'
                            )}
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
                        <div className="flex-1 min-h-[250px]" id="tour-console">
                            <Console logs={status.logs} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="h-full flex flex-col" id="tour-agent">
                    <CrateIntelligence 
                        appStatus={status} 
                        currentPath={path}
                        onRunCommand={(cmd, args) => {
                            if (cmd === 'trigger_pipeline' || cmd === 'start_pipeline') {
                                if (args?.mode === 'execute') {
                                    if (hasAnalysis) handleCommit();
                                    else alert("Please run a Dry Run first.");
                                } else {
                                    handleAnalyzeClick();
                                }
                            } else if (cmd === 'update_path' || cmd === 'set_path') {
                                if (args?.path) setPath(args.path);
                            }
                        }}
                    />
                </div>

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
            <AppDrawer 
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
                onStartTour={() => { setIsDrawerOpen(false); setIsTourOpen(true); }}
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
            />
            
            <OnboardingTour 
                isOpen={isTourOpen} 
                onClose={() => setIsTourOpen(false)} 
                steps={TOUR_STEPS} 
            />

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            
            <ExportModal 
                isOpen={isExportOpen} 
                onClose={() => setIsExportOpen(false)} 
                scanResults={status.proposed_changes || []}
            />

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
                {!isCompletedAndMoved && (
                    <header className="flex flex-row items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors duration-300">
                        <div className="flex items-center gap-4">
                            {/* UPDATED LOGO: Neon Red X with Glow */}
                            <div className="relative flex items-center justify-center pl-4 group select-none cursor-default w-24 h-10 overflow-visible">
                                {/* The X - Background Layer */}
                                <span 
                                    className="absolute left-1/2 top-1/2 text-5xl font-black italic text-red-600 dark:text-red-500 transition-all drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] dark:drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] opacity-90 group-hover:opacity-100" 
                                    style={{ 
                                        transform: 'translate(-50%, -50%) skewX(-12deg) scale(1.6)', 
                                        zIndex: 0 
                                    }}
                                >
                                    X
                                </span>
                                
                                {/* The CRATE - Foreground Layer */}
                                <span className="relative z-10 text-3xl font-black tracking-tighter text-zinc-900 dark:text-white mix-blend-normal group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
                                    CRATE
                                </span>
                            </div>

                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 ml-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">v1.0.0</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:gap-4">
                            <button 
                                onClick={() => setIsTourOpen(true)}
                                className="relative p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                title="Start Guided Tour"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>

                            <button className="relative p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
                                )}
                            </button>

                            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>

                            <div 
                                id="tour-status"
                                className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-help ${backendOnline 
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                                : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                            }`}>
                                <div className="relative flex items-center justify-center">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {backendOnline 
                                        ? <Wifi className={`w-3.5 h-3.5 relative z-10 text-emerald-600 dark:text-emerald-400`} /> 
                                        : <WifiOff className={`w-3.5 h-3.5 relative z-10 text-amber-600 dark:text-amber-400`} />
                                    }
                                </div>
                                <div className="hidden sm:flex flex-col items-start leading-none">
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Status</span>
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${backendOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {backendOnline ? 'Online' : 'Simulated'}
                                    </span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
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
