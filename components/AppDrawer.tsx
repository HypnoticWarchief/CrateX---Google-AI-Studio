
import React from 'react';
import { X, History, Settings, Disc, Sun, Moon, Activity } from 'lucide-react';

interface AppDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    onOpenHistory: () => void;
    onOpenExport: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const AppDrawer: React.FC<AppDrawerProps> = ({ 
    isOpen, onClose, onOpenSettings, onOpenHistory, onOpenExport, isDarkMode, toggleTheme 
}) => {
    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-72 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                        <span className="font-black text-sm tracking-widest uppercase text-zinc-900 dark:text-white flex items-center gap-2">
                            System Menu
                        </span>
                        <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors group">
                            <X className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        <MenuItem 
                            icon={<History className="w-4 h-4" />}
                            title="Operation History"
                            description="View logs & rollback"
                            onClick={() => { onOpenHistory(); onClose(); }}
                            colorClass="text-blue-500 bg-blue-500/10 border-blue-500/20"
                        />

                        <MenuItem 
                            icon={<Settings className="w-4 h-4" />}
                            title="Configuration"
                            description="API keys & preferences"
                            onClick={() => { onOpenSettings(); onClose(); }}
                            colorClass="text-zinc-500 bg-zinc-500/10 border-zinc-500/20"
                        />

                        <MenuItem 
                            icon={<Disc className="w-4 h-4" />}
                            title="Rekordbox Bridge"
                            description="XML Database export"
                            onClick={() => { onOpenExport(); onClose(); }}
                            colorClass="text-purple-500 bg-purple-500/10 border-purple-500/20"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50 dark:bg-zinc-900/50">
                         <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm group">
                            <div className="flex items-center gap-3">
                                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-orange-400" />}
                                <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                </span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-zinc-300'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${isDarkMode ? 'left-4.5' : 'left-0.5'}`} style={{ left: isDarkMode ? '18px' : '2px' }} />
                            </div>
                         </button>
                         
                         <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-400 uppercase tracking-widest font-bold pt-2">
                            <Activity className="w-2.5 h-2.5" /> CrateX v1.0.0
                         </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const MenuItem = ({ icon, title, description, onClick, colorClass }: any) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-left group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center border transition-transform group-hover:scale-105 shadow-sm ${colorClass}`}>
            {icon}
        </div>
        <div>
            <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[13px] tracking-tight group-hover:text-black dark:group-hover:text-white">{title}</div>
            <div className="text-[10px] text-zinc-500 font-medium">{description}</div>
        </div>
    </button>
);

export default AppDrawer;
