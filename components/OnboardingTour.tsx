
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

export interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
    steps: TourStep[];
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, steps }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Reset step when opened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            // Disable scroll when tour is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Calculate position of the target element
    useLayoutEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            const element = document.getElementById(step.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);
                // Ensure element is in view
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        // Small delay to allow UI to settle if a modal just opened
        const t = setTimeout(updatePosition, 100); 

        return () => {
            window.removeEventListener('resize', updatePosition);
            clearTimeout(t);
        };
    }, [isOpen, currentStep, steps]);

    if (!isOpen || !targetRect) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    // Calculate Tooltip Position
    let tooltipStyle: React.CSSProperties = {};
    const gap = 12;

    switch (step.position) {
        case 'bottom':
            tooltipStyle = { top: targetRect.bottom + gap, left: targetRect.left + (targetRect.width / 2) - 160 }; // Centered-ish
            break;
        case 'top':
            tooltipStyle = { bottom: window.innerHeight - targetRect.top + gap, left: targetRect.left + (targetRect.width / 2) - 160 };
            break;
        case 'left':
            tooltipStyle = { top: targetRect.top, right: window.innerWidth - targetRect.left + gap };
            break;
        case 'right':
            tooltipStyle = { top: targetRect.top, left: targetRect.right + gap };
            break;
    }

    // Ensure tooltip stays on screen horizontally
    if (tooltipStyle.left && (tooltipStyle.left as number) < 10) tooltipStyle.left = 10;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            {/* Dark Backdrop with "Cutout" effect via hard clip-path or just semi-transparent overlay + high z-index target logic */}
            {/* Simpler approach: Full dim overlay, then render a highlight box absolute positioned */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500" />

            {/* The Highlight Box */}
            <div 
                className="absolute transition-all duration-300 ease-in-out border-2 border-red-500 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.4)] pointer-events-none"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                }}
            />

            {/* The Tooltip Card */}
            <div 
                className="absolute w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-5 flex flex-col gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                style={tooltipStyle}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-[10px]">
                        <HelpCircle className="w-3 h-3" />
                        <span>Step {currentStep + 1} of {steps.length}</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight mb-1">
                        {step.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {step.description}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button 
                        onClick={() => onClose()}
                        className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                        Skip Tour
                    </button>
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <button 
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                if (isLast) onClose();
                                else setCurrentStep(prev => prev + 1);
                            }}
                            className="flex items-center gap-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
                        >
                            {isLast ? "Finish" : "Next"} <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
