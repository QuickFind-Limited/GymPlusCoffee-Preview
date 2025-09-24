import { cn } from '@/lib/utils';
import React from 'react';

export interface ClarificationResolvedContextProps {
  resolvedContext: Record<string, string>;
  autoApplied: Record<string, string>;
  className?: string;
}

const ClarificationResolvedContext: React.FC<ClarificationResolvedContextProps> = ({
  resolvedContext,
  autoApplied,
  className,
}) => {
  const entries = Object.entries(resolvedContext ?? {});
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-background border rounded-2xl p-5 shadow-sm', className)}>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Selections Made</h3>
      <div className="mt-3 space-y-2">
        {entries.map(([key, value]) => {
          const isDefault = key in (autoApplied ?? {});
          return (
            <div key={key} className="text-sm text-gray-700 dark:text-gray-200">
              <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {key}:
              </span>{' '}
              <span className="font-normal text-gray-700 dark:text-gray-200">
                {value} {isDefault ? '(default)' : '(user)'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClarificationResolvedContext;
