
import React, { useEffect, useRef, useState } from 'react';
import { Terminal, ArrowDown } from 'lucide-react';

interface ConsoleProps {
    logs: string[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

    // Smart Auto-scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Only scroll to bottom if the user hasn't manually scrolled up
        if (!userHasScrolledUp) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [logs, userHasScrolledUp]);

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        // Check distance from bottom (allow 50px buffer)
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
        setUserHasScrolledUp(!isAtBottom);
    };

    const scrollToBottom = () => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        setUserHasScrolledUp(false);
    };

    return (
        <div className="bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-96 md:h-full font-mono text-sm overflow-hidden relative group">
            <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-900 flex items-center gap-2 select-none">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">System Output</span>
            </div>
            
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 p-4 overflow-y-auto space-y-1.5 bg-black scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            >
                {logs.length === 0 && (
                    <span className="text-zinc-700 italic text-xs">System ready. Waiting for process execution...</span>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="text-emerald-500 break-words leading-relaxed text-xs font-medium font-mono">
                        <span className="opacity-30 mr-3 select-none text-zinc-400 inline-block w-16 text-right">{log.substring(0, 10)}</span>
                        <span className="text-emerald-400/90">{log.substring(10)}</span>
                    </div>
                ))}
            </div>

            {/* Resume Auto-scroll Button */}
            {userHasScrolledUp && (
                <button 
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full shadow-lg border border-zinc-700 transition-all animate-in fade-in zoom-in"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default Console;
