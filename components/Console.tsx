import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface ConsoleProps {
    logs: string[];
}

const Console: React.FC<ConsoleProps> = ({ logs }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="bg-black rounded-lg border border-slate-700 shadow-2xl flex flex-col h-96 md:h-full font-mono text-sm overflow-hidden">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-500" />
                <span className="text-slate-400 text-xs uppercase tracking-wider">Live Execution Log</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-1">
                {logs.length === 0 && (
                    <span className="text-slate-600 italic">Waiting for process to start...</span>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="text-green-500 break-words leading-tight">
                        <span className="opacity-50 mr-2">{log.substring(0, 10)}</span>
                        <span>{log.substring(10)}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default Console;
