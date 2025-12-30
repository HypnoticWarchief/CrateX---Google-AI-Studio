
import React from 'react';
import { PipelineStage } from '../types';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface StepperProps {
    currentStage: PipelineStage;
    progress: number;
}

const STAGES = [
    PipelineStage.SCAN,
    PipelineStage.GROUP,
    PipelineStage.AI_DISCOVERY,
    PipelineStage.NORMALIZE,
    PipelineStage.SORT,
    PipelineStage.ANALYSIS,
    PipelineStage.EMBED,
    PipelineStage.SKIPPED,
    PipelineStage.REPORT,
];

const Stepper: React.FC<StepperProps> = ({ currentStage, progress }) => {
    
    // Determine the index of the current stage
    const currentIndex = STAGES.indexOf(currentStage);
    const isCompleted = currentStage === PipelineStage.COMPLETED;
    const isRollingBack = currentStage === PipelineStage.ROLLBACK;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl h-full overflow-y-auto transition-colors duration-300 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="text-red-600 animate-pulse">◆</span> Pipeline Stages
            </h3>
            
            <div className="space-y-0 relative">
                {/* Connecting Line Background */}
                <div className="absolute left-[11px] top-3 bottom-5 w-[2px] bg-zinc-100 dark:bg-zinc-800 z-0"></div>

                {STAGES.map((stage, index) => {
                    let status: 'pending' | 'active' | 'completed' = 'pending';

                    if (isCompleted) status = 'completed';
                    else if (isRollingBack) status = 'pending'; // Reset visual on rollback
                    else if (currentIndex > index) status = 'completed';
                    else if (currentIndex === index) status = 'active';

                    return (
                        <div key={stage} className={`relative z-10 flex gap-4 pb-6 last:pb-0 ${status === 'pending' ? 'opacity-40' : 'opacity-100'} transition-opacity duration-300`}>
                            {/* Icon Container */}
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border-2 transition-all duration-300 ${
                                status === 'active' ? 'border-red-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 
                                status === 'completed' ? 'border-green-500 bg-green-500' : 'border-zinc-300 dark:border-zinc-700'
                            }`}>
                                {status === 'completed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : status === 'active' ? (
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                ) : (
                                    <div className="w-2 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-1 pt-0.5">
                                <span className={`text-sm font-medium transition-colors ${status === 'active' ? 'text-red-600 dark:text-red-400 font-bold tracking-wide' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                    {stage}
                                </span>
                                {status === 'active' && (
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 mt-2 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                                        <div 
                                            className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-300 ease-out"
                                            style={{ width: `${Math.max(5, (progress % 10) * 10)}%` }} 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Stepper;
    