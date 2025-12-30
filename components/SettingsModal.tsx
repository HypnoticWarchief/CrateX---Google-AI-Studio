
import React, { useState, useEffect } from 'react';
import { Key, Sparkles, Zap, Brain, Music, User, LayoutGrid, Globe, Settings, CreditCard } from 'lucide-react';
import { AIModel } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettingsTab = 'general' | 'integrations' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [localKey, setLocalKey] = useState('');
    const [spotifyToken, setSpotifyToken] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [systemKeyExists, setSystemKeyExists] = useState(false);
    const [selectedModel, setSelectedModel] = useState<AIModel>(AIModel.FLASH_LITE);
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    useEffect(() => {
        const storedKey = localStorage.getItem("cratex_api_key") || "";
        const storedSpotify = localStorage.getItem("cratex_spotify_token") || "";
        const storedModel = localStorage.getItem("cratex_model") as AIModel || AIModel.FLASH_LITE;
        
        setLocalKey(storedKey);
        setSpotifyToken(storedSpotify);
        setSavedKey(storedKey);
        setSelectedModel(storedModel);
        setSystemKeyExists(!!process.env.GEMINI_API_KEY);
    }, [isOpen]);

    const handleSave = () => {
        if (localKey.trim()) {
            localStorage.setItem("cratex_api_key", localKey.trim());
        } else {
            localStorage.removeItem("cratex_api_key");
        }

        if (spotifyToken.trim()) {
            localStorage.setItem("cratex_spotify_token", spotifyToken.trim());
        } else {
            localStorage.removeItem("cratex_spotify_token");
        }

        localStorage.setItem("cratex_model", selectedModel);
        
        setSavedKey(localKey.trim());
        onClose();
    };

    const handleClear = () => {
        localStorage.removeItem("cratex_api_key");
        localStorage.removeItem("cratex_spotify_token");
        setLocalKey("");
        setSpotifyToken("");
        setSavedKey("");
    };

    if (!isOpen) return null;

    const isUsingSystemKey = !savedKey && systemKeyExists;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl h-[550px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row font-sans">
                
                {/* Sidebar */}
                <div className="w-full md:w-56 bg-zinc-50 dark:bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
                    <div className="p-5 flex items-center gap-2.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                        <div className="w-6 h-6 bg-zinc-900 dark:bg-white rounded-md flex items-center justify-center text-white dark:text-black shadow-sm">
                            <Settings className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">Configuration</span>
                    </div>
                    
                    <div className="flex-1 px-3 py-3 space-y-0.5">
                        <TabButton 
                            active={activeTab === 'general'} 
                            onClick={() => setActiveTab('general')} 
                            icon={<LayoutGrid className="w-3.5 h-3.5" />} 
                            label="General" 
                        />
                        <TabButton 
                            active={activeTab === 'integrations'} 
                            onClick={() => setActiveTab('integrations')} 
                            icon={<Globe className="w-3.5 h-3.5" />} 
                            label="Integrations" 
                        />
                        <TabButton 
                            active={activeTab === 'about'} 
                            onClick={() => setActiveTab('about')} 
                            icon={<User className="w-3.5 h-3.5" />} 
                            label="Account" 
                        />
                    </div>

                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 md:hidden">
                         <button onClick={onClose} className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 rounded text-xs font-bold">Close</button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900 relative">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">AI Core</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Select the neural engine for your library.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    <ModelOption 
                                        selected={selectedModel === AIModel.FLASH_LITE}
                                        onClick={() => setSelectedModel(AIModel.FLASH_LITE)}
                                        icon={<Zap className="w-4 h-4 fill-current" />}
                                        title="Flash Lite 2.5"
                                        desc="High speed, optimized for large libraries."
                                        color="text-red-500"
                                        bg="bg-red-500"
                                        border="border-red-500"
                                    />

                                    <ModelOption 
                                        selected={selectedModel === AIModel.PRO}
                                        onClick={() => setSelectedModel(AIModel.PRO)}
                                        icon={<Brain className="w-4 h-4" />}
                                        title="Gemini 3 Pro"
                                        desc="Complex reasoning for deep genre analysis."
                                        color="text-purple-500"
                                        bg="bg-purple-500"
                                        border="border-purple-500"
                                    />
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" /> Gemini API Key
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            value={localKey}
                                            onChange={(e) => setLocalKey(e.target.value)}
                                            placeholder={isUsingSystemKey ? "Using System Key" : "Enter API Key..."}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-2.5 pl-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-xs transition-all"
                                        />
                                        <div className="absolute left-3 top-3 text-zinc-400">
                                            <Key className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400">
                                        {selectedModel === AIModel.PRO 
                                            ? <span className="text-purple-500 font-bold">Pro requires a paid key.</span> 
                                            : "Free tier keys accepted."}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'integrations' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">External Services</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Connect third-party platforms.</p>
                                </div>
                                
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-4 rounded-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm shadow-green-500/20">
                                            <Music className="w-4 h-4" />
                                        </div>
                                        <div className="font-bold text-sm text-zinc-900 dark:text-white">Spotify</div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Access Token</label>
                                        <div className="relative">
                                            <input 
                                                type="password" 
                                                value={spotifyToken}
                                                onChange={(e) => setSpotifyToken(e.target.value)}
                                                placeholder="Paste Token..."
                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 p-2.5 pl-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 font-mono text-xs"
                                            />
                                            <div className="absolute left-3 top-3 text-zinc-400">
                                                <Key className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 leading-relaxed">
                                            Required for Agent playlists. <a href="https://developer.spotify.com/console/post-playlists/" target="_blank" className="text-green-600 underline decoration-green-500/30 font-bold hover:text-green-700">Get Token</a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Account & System</h3>
                                    <p className="text-xs text-zinc-500 mt-1">Manage application state.</p>
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                                        <User className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-zinc-900 dark:text-white">Local User</div>
                                        <div className="text-xs text-zinc-500">Administrator</div>
                                    </div>
                                    <div className="ml-auto flex flex-col items-end">
                                        <div className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase rounded border border-emerald-200 dark:border-emerald-500/20 tracking-wider">
                                            Pro Active
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500">Version</span>
                                        <span className="font-mono font-bold text-zinc-900 dark:text-white">v1.0.2-beta</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-500">Build Target</span>
                                        <span className="font-mono font-bold text-zinc-900 dark:text-white">Production</span>
                                    </div>
                                </div>

                                {savedKey && (
                                    <button 
                                        onClick={handleClear}
                                        className="w-full py-2.5 mt-2 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Reset All Keys
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-950">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 text-xs font-bold uppercase tracking-wide rounded-lg shadow-lg transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            active 
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700' 
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
        }`}
    >
        {icon} {label}
    </button>
);

const ModelOption = ({ selected, onClick, icon, title, desc, color, bg, border }: any) => (
    <button 
        onClick={onClick}
        className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
            selected 
            ? `bg-white dark:bg-zinc-800/50 ${border} ring-0 shadow-sm` 
            : 'bg-zinc-50 dark:bg-zinc-950 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
        }`}
    >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selected ? `${bg} text-white` : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
            {icon}
        </div>
        <div className="text-left">
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">{title}</div>
            <div className="text-[10px] text-zinc-500">{desc}</div>
        </div>
    </button>
);

export default SettingsModal;
