
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, ShieldAlert, ShoppingCart, Music, ArrowDown, ExternalLink, Trash2, Zap, BrainCircuit, Sparkles } from 'lucide-react';
import { askGeminiAgent } from '../services/api';
import { PipelineStatus } from '../types';

interface CrateIntelligenceProps {
    appStatus?: PipelineStatus; // Optional prop to let Agent see state
    currentPath?: string;
    onRunCommand?: (cmd: string, args: any) => void;
}

// --- ROBOT COMPONENT ---
const CrateBot = ({ state }: { state: 'idle' | 'listening' | 'thinking' | 'speaking' }) => {
    // Defines the eye/animation state based on prop
    return (
        <div className={`relative w-20 h-20 transition-all duration-500 ${state === 'thinking' ? 'animate-float' : ''}`}>
             {/* Glow Effect behind robot */}
             <div className={`absolute inset-0 bg-red-500 rounded-full blur-xl opacity-0 transition-opacity duration-500 ${state === 'thinking' || state === 'speaking' ? 'opacity-40 animate-pulse' : ''}`} />
             
             {/* Main Head */}
             <div className="relative w-full h-full bg-zinc-900 dark:bg-black rounded-2xl border-2 border-zinc-700 dark:border-zinc-800 shadow-xl overflow-hidden flex items-center justify-center">
                {/* Screen Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:4px_4px] opacity-50 z-10 pointer-events-none" />

                {/* Eyes Container */}
                <div className={`flex gap-3 transition-all duration-300 z-20 ${state === 'listening' ? 'scale-110' : ''}`}>
                    {state === 'thinking' ? (
                        // Loading Animation (Cyclon/Knight Rider style single eye)
                        <div className="w-12 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                             <div className="absolute top-0 bottom-0 left-0 w-4 bg-red-500 rounded-full animate-[ping_1s_ease-in-out_infinite_alternate]" style={{ animationName: 'scan', animationDuration: '0.8s', animationIterationCount: 'infinite', animationDirection: 'alternate' }} />
                             <style>{`@keyframes scan { from { left: 0; } to { left: calc(100% - 16px); } }`}</style>
                        </div>
                    ) : (
                        // Standard Eyes
                        <>
                            <div className={`w-3 h-5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-300 ${state === 'listening' ? 'h-6' : state === 'speaking' ? 'h-2 animate-bounce' : 'h-5'}`} />
                            <div className={`w-3 h-5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-300 ${state === 'listening' ? 'h-6' : state === 'speaking' ? 'h-2 animate-bounce' : 'h-5'}`} style={{ animationDelay: '0.1s' }} />
                        </>
                    )}
                </div>

                {/* Mouth Line (Visible only when speaking or idle) */}
                {state !== 'thinking' && (
                     <div className={`absolute bottom-5 w-6 h-0.5 bg-zinc-600 rounded-full transition-all duration-300 ${state === 'speaking' ? 'w-8 bg-red-500 animate-pulse' : 'w-4'}`} />
                )}
             </div>

             {/* Antenna */}
             <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                 <div className={`w-2 h-2 rounded-full ${state === 'idle' ? 'bg-zinc-500' : 'bg-red-500 animate-ping'}`} />
                 <div className="w-0.5 h-2 bg-zinc-600" />
             </div>
        </div>
    );
};

const CrateIntelligence: React.FC<CrateIntelligenceProps> = ({ appStatus, currentPath, onRunCommand }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [botState, setBotState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [messages, setMessages] = useState<{role: 'user' | 'ai' | 'error', text: string, type?: 'text' | 'link' | 'playlist', meta?: any}[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

    // Smart Auto-scroll logic
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (!userHasScrolledUp) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, userHasScrolledUp, loading]);

    // Bot State Logic
    useEffect(() => {
        if (loading) {
            setBotState('thinking');
        } else if (input.length > 0) {
            setBotState('listening');
        } else if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
            // Briefly show speaking state after response
            setBotState('speaking');
            const t = setTimeout(() => setBotState('idle'), 2000);
            return () => clearTimeout(t);
        } else {
            setBotState('idle');
        }
    }, [input, loading, messages]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
        setUserHasScrolledUp(!isAtBottom);
    };

    const scrollToBottom = () => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        setUserHasScrolledUp(false);
    };

    const handleClear = () => {
        setMessages([]);
        setUserHasScrolledUp(false);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);
        setUserHasScrolledUp(false); // Force scroll on new message

        try {
            // Context to pass to Agent
            const context = {
                path: currentPath || "/Unknown/Path",
                status: appStatus || { is_running: false, stats: {} }
            };

            const responseText = await askGeminiAgent(userMsg, context, (action, params) => {
                // Agent Logic Dispatcher
                if (action === 'trigger_pipeline') {
                     if (onRunCommand) onRunCommand('start_pipeline', params);
                } else if (action === 'update_path') {
                     if (onRunCommand) onRunCommand('set_path', params);
                } else if (action === 'find_purchase_link') {
                     // Add a special message type for links
                     setMessages(prev => [...prev, {
                         role: 'ai',
                         text: `Found "${params.query}" on ${params.store || 'Bandcamp'}.`,
                         type: 'link',
                         meta: { url: `https://www.beatport.com/search?q=${encodeURIComponent(params.query)}`, store: params.store }
                     }]);
                } else if (action === 'create_playlist') {
                     setMessages(prev => [...prev, {
                         role: 'ai',
                         text: `Playlist "${params.name}" created on ${params.platform}.`,
                         type: 'playlist',
                         meta: { platform: params.platform, name: params.name }
                     }]);
                }
            });
            
            // Only add text response if it wasn't intercepted by a special action type that adds its own message
            // or if the text is substantial
            if (responseText && !responseText.includes("Executing")) {
                 setMessages(prev => [...prev, { 
                    role: 'ai', 
                    text: responseText,
                    type: 'text'
                }]);
            }

        } catch (err: any) {
            console.error(err);
            const isRateLimit = err.message?.includes("Rate Limit");
            setMessages(prev => [...prev, { 
                role: 'error', 
                text: isRateLimit ? err.message : "Agent Error: " + err.message 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col h-full shadow-xl overflow-hidden transition-colors duration-300 relative group/container">
            
            {/* Header / Bot Area */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-4">
                    <div className="transform scale-75 origin-left">
                        <CrateBot state={botState} />
                    </div>
                    <div>
                        <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">CrateBot</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                            {loading ? 'Processing...' : 'Online'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                         <button onClick={handleClear} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 bg-transparent px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    )}
                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                         <BrainCircuit className="w-3 h-3 text-purple-500" />
                         Agentic
                    </div>
                </div>
            </div>

            {/* Chat Body */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-50/50 dark:bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 relative min-h-0"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:16px_16px]" />

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6 animate-in fade-in zoom-in duration-500 z-0">
                        <div className="bg-white dark:bg-zinc-800/30 p-4 rounded-full border border-zinc-100 dark:border-zinc-700/50 mb-4 shadow-sm">
                            <Sparkles className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-zinc-900 dark:text-white font-bold text-sm">Awaiting Command</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2 leading-relaxed max-w-[240px] mx-auto">
                            Ask me to sort your library, create playlists, or find music.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-6 max-w-xs w-full">
                            {["Analyze library", "Find techno tracks", "Create playlist", "Who is Burial?"].map(cmd => (
                                <button 
                                    key={cmd} 
                                    onClick={() => setInput(cmd)} 
                                    className="px-3 py-2 text-[10px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 hover:border-red-500 hover:text-red-500 transition-colors"
                                >
                                    "{cmd}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                {messages.map((m, i) => (
                    <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 z-10 relative`}>
                        {m.role === 'ai' && (
                            <div className="w-6 h-6 mr-2 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 mt-1 flex-shrink-0">
                                <Bot className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                        )}
                        
                        {m.role === 'error' ? (
                            <div className="max-w-[85%] p-3 rounded-xl text-xs bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 flex items-start gap-3">
                                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                                <div className="break-words">{m.text}</div>
                            </div>
                        ) : m.type === 'link' ? (
                            <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-emerald-500/30 shadow-sm text-zinc-800 dark:text-zinc-200">
                                <p className="text-[11px] mb-3 font-medium">{m.text}</p>
                                <a href={m.meta.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20">
                                    <ShoppingCart className="w-3 h-3" /> Buy Now
                                </a>
                            </div>
                        ) : m.type === 'playlist' ? (
                            <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-green-500/30 shadow-sm text-zinc-800 dark:text-zinc-200">
                                <p className="text-[11px] mb-3 font-medium">{m.text}</p>
                                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                    <Music className="w-3 h-3" /> Exported
                                </div>
                            </div>
                        ) : (
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm break-words ${
                                m.role === 'user' 
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black rounded-br-sm' 
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-sm'
                            }`}>
                                <FormattedMessage text={m.text} />
                            </div>
                        )}
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="bg-white dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-sm border border-zinc-200 dark:border-zinc-700 flex items-center gap-3 shadow-sm">
                            <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Processing...</span>
                        </div>
                    </div>
                )}
                <div className="h-4" /> {/* Spacer */}
            </div>

            {/* Scroll Down Button */}
            {userHasScrolledUp && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
                     <button 
                        onClick={scrollToBottom}
                        className="bg-zinc-900/90 dark:bg-zinc-800/90 text-white backdrop-blur-sm px-3 py-1.5 rounded-full shadow-xl border border-zinc-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        <ArrowDown className="w-3 h-3" /> New Messages
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 relative z-20 flex-shrink-0">
                <div className="relative group/input">
                    <div className="absolute inset-0 bg-red-500/5 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none" />
                    <input 
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a command..."
                        className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 pl-4 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 placeholder:text-zinc-400 transition-all"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-500 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-zinc-200 disabled:hover:text-zinc-500"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Internal component to handle text formatting (links, lists)
const FormattedMessage = ({ text }: { text: string }) => {
    // Split text to separate "Sources:" if it exists at the end
    const parts = text.split(/Sources:/i);
    const mainText = parts[0];
    const sourcesText = parts.length > 1 ? parts.slice(1).join("Sources:") : null;

    const renderTextWithLinks = (content: string) => {
        // Regex to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.split(urlRegex).map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a 
                        key={index} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-red-500 hover:underline break-all inline-flex items-center gap-0.5"
                    >
                        {part} <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <div className="whitespace-pre-wrap">
            {renderTextWithLinks(mainText.trim())}
            
            {sourcesText && (
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/50">
                    <span className="font-bold uppercase text-[9px] text-zinc-500 tracking-widest block mb-1">Sources</span>
                    <ul className="space-y-1">
                        {sourcesText.split('\n').filter(line => line.trim().length > 0).map((line, i) => {
                            // Clean up line if it starts with bullet points
                            const cleanLine = line.replace(/^[•\-\*]\s?/, '').trim();
                            if (!cleanLine) return null;
                            
                            return (
                                <li key={i} className="flex items-start gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-300">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>{renderTextWithLinks(cleanLine)}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CrateIntelligence;
