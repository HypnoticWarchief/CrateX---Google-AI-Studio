
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
    const [tooltipStyles, setTooltipStyles] = useState<React.CSSProperties>({});
    
    // Reset step when opened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Calculate position of the target element
    useLayoutEffect(() => {
        if (!isOpen) return;

        const calculatePosition = () => {
            const step = steps[currentStep];
            const element = document.getElementById(step.targetId);
            
            if (element) {
                // Ensure element is visible before measuring
                element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
                
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);
                
                // Tooltip Dimensions
                const tooltipW = 320;
                const tooltipH = 200; // Estimated max height
                const gap = 16;
                const padding = 10;
                
                let top = 0;
                let left = 0;
                let placement = step.position;
                
                // 1. Initial Position Calculation
                switch (placement) {
                    case 'top':
                        top = rect.top - tooltipH - gap;
                        left = rect.left + (rect.width / 2) - (tooltipW / 2);
                        break;
                    case 'bottom':
                        top = rect.bottom + gap;
                        left = rect.left + (rect.width / 2) - (tooltipW / 2);
                        break;
                    case 'left':
                        top = rect.top + (rect.height / 2) - (tooltipH / 2);
                        left = rect.left - tooltipW - gap;
                        break;
                    case 'right':
                        top = rect.top + (rect.height / 2) - (tooltipH / 2);
                        left = rect.right + gap;
                        break;
                }

                // 2. Viewport Boundary Checks (Flip logic)
                const winW = window.innerWidth;
                const winH = window.innerHeight;

                // Vertical flip
                if (placement === 'top' && top < padding) {
                    top = rect.bottom + gap;
                } else if (placement === 'bottom' && top + tooltipH > winH - padding) {
                    top = rect.top - tooltipH - gap;
                }

                // Horizontal flip (only if side positioning)
                if (placement === 'left' && left < padding) {
                    left = rect.right + gap;
                } else if (placement === 'right' && left + tooltipW > winW - padding) {
                    left = rect.left - tooltipW - gap;
                }

                // 3. Hard Clamping with priority to left/top edges
                if (left + tooltipW > winW - padding) left = winW - tooltipW - padding;
                if (left < padding) left = padding;
                
                if (top + tooltipH > winH - padding) top = winH - tooltipH - padding;
                if (top < padding) top = padding;

                setTooltipStyles({
                    top: top,
                    left: left,
                    width: tooltipW,
                    maxWidth: 'calc(100vw - 32px)', // Critical fix for small mobile screens
                    position: 'fixed'
                });
            }
        };

        // Calculate immediately
        calculatePosition();
        
        // Recalculate after small delay to handle smooth scroll finishing
        const t1 = setTimeout(calculatePosition, 100);
        const t2 = setTimeout(calculatePosition, 300);
        const t3 = setTimeout(calculatePosition, 500);

        window.addEventListener('resize', calculatePosition);

        return () => {
            window.removeEventListener('resize', calculatePosition);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [isOpen, currentStep, steps]);

    if (!isOpen || !targetRect) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden font-sans pointer-events-none">
            {/* Dark Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500 pointer-events-auto" />

            {/* The Highlight Box */}
            <div 
                className="absolute transition-all duration-500 ease-in-out border-2 border-red-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-10 box-content"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                    position: 'fixed'
                }}
            />

            {/* The Tooltip Card */}
            <div 
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-5 flex flex-col gap-3 transition-all duration-300 animate-in fade-in zoom-in-95 pointer-events-auto z-20"
                style={tooltipStyles}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-[10px]">
                        <HelpCircle className="w-3 h-3" />
                        <span>Step {currentStep + 1} of {steps.length}</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight mb-2">
                        {step.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                        {step.description}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button 
                        onClick={() => onClose()}
                        className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 uppercase tracking-wide"
                    >
                        Skip
                    </button>
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <button 
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                if (isLast) onClose();
                                else setCurrentStep(prev => prev + 1);
                            }}
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg shadow-red-600/20 transition-all active:scale-95"
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
