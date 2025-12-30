
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
                // Ensure element is in view with padding
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        const t = setTimeout(updatePosition, 100); 

        return () => {
            window.removeEventListener('resize', updatePosition);
            clearTimeout(t);
        };
    }, [isOpen, currentStep, steps]);

    if (!isOpen || !targetRect) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    // --- Calculate Tooltip Position with Viewport Boundary Checks ---
    const gap = 16;
    const tooltipWidth = 320;
    const tooltipHeightApprox = 200; // rough estimate
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top: number | undefined;
    let left: number | undefined;
    let right: number | undefined;
    let bottom: number | undefined;

    // Prefer specified position but flip if off-screen
    let pos = step.position;

    // Check flipping logic
    if (pos === 'bottom' && targetRect.bottom + tooltipHeightApprox > windowHeight) pos = 'top';
    if (pos === 'top' && targetRect.top - tooltipHeightApprox < 0) pos = 'bottom';
    if (pos === 'right' && targetRect.right + tooltipWidth > windowWidth) pos = 'left';
    if (pos === 'left' && targetRect.left - tooltipWidth < 0) pos = 'right';

    switch (pos) {
        case 'bottom':
            top = targetRect.bottom + gap;
            left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
            break;
        case 'top':
            // Instead of 'bottom' css property, calculate 'top' so it works better with absolute positioning flow
            top = targetRect.top - tooltipHeightApprox - gap; // rough initial, CSS will handle height better if we use bottom styling, but let's stick to absolute top/left
            // Revert to bottom property for top positioning to handle variable height
            top = undefined;
            bottom = windowHeight - targetRect.top + gap;
            left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
            break;
        case 'left':
            top = targetRect.top;
            right = windowWidth - targetRect.left + gap;
            left = undefined;
            break;
        case 'right':
            top = targetRect.top;
            left = targetRect.right + gap;
            break;
    }

    // Horizontal Safety Clamp
    if (left !== undefined) {
        if (left < 10) left = 10;
        if (left + tooltipWidth > windowWidth - 10) left = windowWidth - tooltipWidth - 10;
    }

    const tooltipStyle: React.CSSProperties = {
        top,
        left,
        right,
        bottom,
        width: tooltipWidth,
        maxWidth: '90vw' // Mobile safety
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
            {/* Dark Backdrop - Stronger opacity for better text contrast/isolation */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500" />

            {/* The Highlight Box */}
            <div 
                className="absolute transition-all duration-300 ease-in-out border-2 border-red-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                    // The shadow mimics a "cutout" focus effect
                }}
            />

            {/* The Tooltip Card */}
            <div 
                className="absolute bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-5 flex flex-col gap-3 transition-all duration-300 animate-in fade-in zoom-in-95"
                style={tooltipStyle}
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
                
                {/* Arrow Pointer (Simple implementation) */}
                <div className="absolute w-3 h-3 bg-white dark:bg-zinc-900 border-l border-t border-zinc-200 dark:border-zinc-700 transform rotate-45 z-[-1]"
                     style={{
                         top: pos === 'bottom' ? -6 : undefined,
                         bottom: pos === 'top' ? -6 : undefined,
                         left: (pos === 'bottom' || pos === 'top') ? '50%' : undefined,
                         right: pos === 'left' ? -6 : undefined,
                         marginLeft: (pos === 'bottom' || pos === 'top') ? -6 : undefined,
                         display: (pos === 'left' || pos === 'right') ? 'none' : 'block' // Hide for side positioning for simplicity or add complicated logic
                     }}
                />
            </div>
        </div>
    );
};

export default OnboardingTour;
