import React from 'react';
import { cn } from '../lib/utils';

const BELT_PHASES = ['white', 'blue', 'purple', 'brown', 'black'];

const BELT_STYLES = {
  white: 'bg-white',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  brown: 'bg-amber-900',
  black: 'bg-zinc-900 border border-zinc-600',
};

const BeltProgress = ({ currentPhase = 'white', showLabels = false, size = 'md' }) => {
  const currentIndex = BELT_PHASES.indexOf(currentPhase);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full" data-testid="belt-progress">
      <div className={cn('belt-progress', sizeClasses[size])}>
        {BELT_PHASES.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div
              key={phase}
              className={cn(
                'belt-segment rounded-sm transition-all duration-300',
                BELT_STYLES[phase],
                isCompleted && 'completed opacity-100',
                isActive && 'active',
                isFuture && 'future'
              )}
              data-testid={`belt-${phase}`}
              title={`${phase.charAt(0).toUpperCase() + phase.slice(1)} Belt`}
            />
          );
        })}
      </div>
      
      {showLabels && (
        <div className="flex justify-between mt-2">
          {BELT_PHASES.map((phase, index) => {
            const isActive = index === currentIndex;
            return (
              <span
                key={phase}
                className={cn(
                  'text-xs font-accent uppercase',
                  isActive ? 'text-[#C0A062]' : 'text-zinc-500'
                )}
              >
                {phase}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BeltProgress;
