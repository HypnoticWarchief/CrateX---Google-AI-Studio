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
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl h-full overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-blue-500">◆</span> Pipeline Stages
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
                                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                                ) : status === 'active' ? (
                                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                ) : (
                                    <Circle className="w-6 h-6 text-slate-500" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-medium ${status === 'active' ? 'text-blue-200' : 'text-slate-300'}`}>
                                    {stage}
                                </span>
                                {status === 'active' && (
                                    <div className="w-full bg-slate-700 h-1 mt-1 rounded-full overflow-hidden w-24">
                                        <div 
                                            className="bg-blue-500 h-full transition-all duration-300"
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
