
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, ShieldAlert, ShoppingCart, Music, ArrowDown, ExternalLink, Trash2 } from 'lucide-react';
import { askGeminiAgent } from '../services/api';
import { PipelineStatus } from '../types';

interface CrateIntelligenceProps {
    appStatus?: PipelineStatus; // Optional prop to let Agent see state
    currentPath?: string;
    onRunCommand?: (cmd: string, args: any) => void;
}

const CrateIntelligence: React.FC<CrateIntelligenceProps> = ({ appStatus, currentPath, onRunCommand }) => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'ai' | 'error', text: string, type?: 'text' | 'link' | 'playlist', meta?: any}[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

    // Smart Auto-scroll logic
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (!userHasScrolledUp) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, userHasScrolledUp, loading]);

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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col h-[600px] lg:h-full shadow-xl overflow-hidden transition-colors duration-300 relative">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-200 tracking-tight">Agentic Command</h3>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                         <button onClick={handleClear} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 bg-transparent px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear
                        </button>
                    )}
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-200 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
                        Auto-Pilot
                    </div>
                </div>
            </div>

            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-5 bg-white dark:bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800"
            >
                {messages.length === 0 && (
                    <div className="text-center py-12 px-6 animate-in fade-in zoom-in duration-500">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-800">
                            <Bot className="w-8 h-8 text-zinc-300" />
                        </div>
                        <p className="text-zinc-900 dark:text-white font-bold text-sm">How can I assist?</p>
                        <p className="text-zinc-400 text-xs mt-2 leading-relaxed max-w-[250px] mx-auto">
                            I can manage your library, create Spotify playlists, or find purchase links for tracks.
                        </p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        {m.role === 'error' ? (
                            <div className="max-w-[90%] p-3 rounded-xl text-xs bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 flex items-start gap-3">
                                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                                <div className="break-words">{m.text}</div>
                            </div>
                        ) : m.type === 'link' ? (
                            <div className="max-w-[90%] p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-emerald-500/30 text-zinc-800 dark:text-zinc-200">
                                <p className="text-[11px] mb-3 font-medium">{m.text}</p>
                                <a href={m.meta.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20">
                                    <ShoppingCart className="w-3 h-3" /> Buy Now
                                </a>
                            </div>
                        ) : m.type === 'playlist' ? (
                            <div className="max-w-[90%] p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-green-500/30 text-zinc-800 dark:text-zinc-200">
                                <p className="text-[11px] mb-3 font-medium">{m.text}</p>
                                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                    <Music className="w-3 h-3" /> Exported
                                </div>
                            </div>
                        ) : (
                            <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm break-words ${
                                m.role === 'user' 
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black rounded-br-none' 
                                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/50 rounded-bl-none'
                            }`}>
                                <FormattedMessage text={m.text} />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 rounded-2xl rounded-bl-none border border-zinc-200 dark:border-zinc-700/50 flex items-center gap-3">
                            <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" />
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Thinking...</span>
                        </div>
                    </div>
                )}
                <div className="h-4" /> {/* Spacer */}
            </div>

            {/* Scroll Down Button */}
            {userHasScrolledUp && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
                     <button 
                        onClick={scrollToBottom}
                        className="bg-zinc-900/90 dark:bg-zinc-800/90 text-white backdrop-blur-sm px-3 py-1.5 rounded-full shadow-xl border border-zinc-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        <ArrowDown className="w-3 h-3" /> New Messages
                    </button>
                </div>
            )}

            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                <div className="relative">
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a command..."
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 pl-4 pr-10 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder:text-zinc-400 transition-all shadow-sm"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-400 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
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
