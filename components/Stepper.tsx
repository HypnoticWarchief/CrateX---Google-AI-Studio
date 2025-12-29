
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
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl h-full overflow-y-auto transition-colors duration-300">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="text-red-600">◆</span> Pipeline Stages
            </h3>
            
            <div className="space-y-6">
                {STAGES.map((stage, index) => {
                    let status: 'pending' | 'active' | 'completed' = 'pending';

                    if (isCompleted) status = 'completed';
                    else if (isRollingBack) status = 'pending'; // Reset visual on rollback
                    else if (currentIndex > index) status = 'completed';
                    else if (currentIndex === index) status = 'active';

                    return (
                        <div key={stage} className={`flex items-center gap-4 ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                            <div className="flex-shrink-0">
                                {status === 'completed' ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : status === 'active' ? (
                                    <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                                ) : (
                                    <Circle className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                                )}
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className={`text-sm font-medium ${status === 'active' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                    {stage}
                                </span>
                                {status === 'active' && (
                                    <div className="w-24 bg-zinc-200 dark:bg-zinc-800 h-1 mt-1 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-red-500 h-full transition-all duration-300"
                                            style={{ width: `${(progress % 10) * 10}%` }} 
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
