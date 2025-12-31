
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Terminal, ArrowDown, Maximize2, Minimize2 } from 'lucide-react';

interface ConsoleProps {
    logs: string[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Performance Optimization: Only render the last 200 logs to prevent DOM bloat
    const visibleLogs = useMemo(() => {
        const MAX_LOGS = 200;
        if (logs.length <= MAX_LOGS) return logs;
        return logs.slice(logs.length - MAX_LOGS);
    }, [logs]);

    const hiddenLogCount = Math.max(0, logs.length - 200);

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
    }, [logs, userHasScrolledUp, isMaximized]);

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

    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
    };

    const containerClasses = isMaximized 
        ? "fixed inset-4 z-50 h-auto" 
        : "h-96 md:h-full relative";

    return (
        <div className={`bg-black rounded-xl border border-green-900/50 shadow-2xl flex flex-col font-mono text-sm overflow-hidden group transition-all duration-300 ${containerClasses}`}>
            
            {isMaximized && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[-1]" onClick={toggleMaximize} />
            )}

            {/* Header */}
            <div className="bg-black/90 px-4 py-2 border-b border-green-900/30 flex items-center gap-2 select-none backdrop-blur-sm z-10">
                <Terminal className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-600 text-[10px] font-bold tracking-[0.2em] animate-pulse">Matrix_Terminal_v1.0</span>
                <div className="ml-auto flex items-center gap-3">
                    {hiddenLogCount > 0 && (
                        <span className="text-[9px] text-green-800">
                            {hiddenLogCount} lines archived
                        </span>
                    )}
                    <button onClick={toggleMaximize} className="text-green-800 hover:text-green-500 transition-colors">
                        {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
            
            {/* CRT Scanline Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20"></div>

            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 p-4 overflow-y-auto space-y-1 bg-black scrollbar-thin scrollbar-thumb-green-900/50 scrollbar-track-black relative z-0"
            >
                {logs.length === 0 && (
                    <span className="text-green-800 italic text-xs animate-pulse">_System ready. Waiting for input signal...</span>
                )}
                
                {visibleLogs.map((log, i) => (
                    <div key={i} className="break-words leading-tight text-xs font-mono group/line hover:bg-green-900/10 transition-colors">
                        {/* Timestamp part (dimmer) */}
                        <span className="text-green-700 font-bold mr-2 text-[10px] select-none">
                            {log.substring(0, 10)}
                        </span>
                        {/* Log Message (Glowing) */}
                        <span className="text-green-400 font-medium drop-shadow-[0_0_5px_rgba(74,222,128,0.4)]">
                             {log.substring(10).trim()}
                        </span>
                    </div>
                ))}
                
                {/* Blinking Cursor */}
                <div className="mt-2 flex items-center">
                    <span className="text-green-700 mr-2 text-[10px] select-none">[{new Date().toLocaleTimeString('en-GB', { hour12: false })}]</span>
                    <div className="w-2.5 h-4 bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                </div>
            </div>

            {/* Resume Auto-scroll Button */}
            {userHasScrolledUp && (
                <button 
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 bg-black/80 hover:bg-green-900/30 text-green-500 p-2 rounded-sm border border-green-500/50 transition-all animate-in fade-in zoom-in z-30 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default Console;
