import { ClarificationSuggestion } from '@/types/clarifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import React from 'react';

export interface ClarificationQuestionCardProps {
  suggestion: ClarificationSuggestion;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onSubmit: () => void | Promise<void>;
  onAcceptDefaults?: () => void | Promise<void>;
  showAcceptDefaults?: boolean;
  showResolvedContext?: boolean;
  autoApplied: Record<string, string>;
  defaultsApplied: Record<string, string>;
  resolvedContext: Record<string, string>;
  loading?: boolean;
  disableInputs?: boolean;
}

const ClarificationQuestionCard: React.FC<ClarificationQuestionCardProps> = ({
  suggestion,
  selectedValues,
  onChange,
  onSubmit,
  onAcceptDefaults,
  showAcceptDefaults = false,
  showResolvedContext = true,
  autoApplied,
  defaultsApplied,
  resolvedContext,
  loading = false,
  disableInputs = false,
}) => {
  const isSingleSelect = suggestion.selector.kind === 'single_select';
  const isMultiSelect = suggestion.selector.kind === 'multi_select';
  const requiresInteraction = suggestion.selector.kind !== 'none';

  const handleValueToggle = (value: string, checked: boolean) => {
    if (disableInputs) return;

    if (isSingleSelect) {
      onChange([value]);
      return;
    }

    const next = new Set(selectedValues);
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    onChange(Array.from(next));
  };

  const resolvedPairs = Object.entries(resolvedContext ?? {});
  const defaultsPairs = Object.entries(defaultsApplied ?? {});

  const renderOptions = () => {
    if (!requiresInteraction) {
      return (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No input required — defaults satisfy this context. Use the button below to continue.
        </p>
      );
    }

    const options = [
      ...(isMultiSelect
        ? [
            {
              value: '__select_all__',
              display_value: 'Select all',
              links: [] as string[],
            },
          ]
        : []),
      ...suggestion.options,
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((option) => {
          const value = option.display_value || option.value;
          const isSelectAll = option.value === '__select_all__';
          const isChecked = selectedValues.includes(value) || selectedValues.includes(option.value);
          const checkedState = isSelectAll
            ? selectedValues.length === suggestion.options.length && suggestion.options.length > 0
            : isChecked;

          return (
            <label
              key={option.value}
              className="flex items-start gap-2 rounded-lg border border-transparent p-2 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
            >
              <input
                type={isSingleSelect ? 'radio' : 'checkbox'}
                name={suggestion.question_id}
                value={option.value}
                disabled={disableInputs || loading}
                checked={checkedState}
                onChange={(event) => {
                  if (isSelectAll) {
                    if (event.target.checked) {
                      onChange(
                        suggestion.options.map((opt) => opt.display_value || opt.value)
                      );
                    } else {
                      onChange([]);
                    }
                  } else {
                    handleValueToggle(value, event.target.checked);
                  }
                }}
                className="mt-1 h-4 w-4"
              />
              <div className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                <p className="font-medium">{option.display_value}</p>
                {option.links && option.links.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option.links.join(', ')}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="bg-background border rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Clarification Needed
            </h3>
            <p className="mt-2 text-base font-medium text-gray-900 dark:text-white">
              {suggestion.clarification_question}
            </p>
          </div>
          <Info className="h-5 w-5 text-muted-foreground" />
        </div>

        {showResolvedContext &&
          (resolvedPairs.length > 0 || defaultsPairs.length > 0 || Object.keys(autoApplied ?? {}).length > 0) && (
            <div className="mt-4 space-y-3 rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
              {resolvedPairs.length > 0 && (
                <div>
                  <p className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Resolved context</p>
                  <div className="flex flex-wrap gap-2">
                    {resolvedPairs.map(([key, value]) => (
                      <Badge
                        key={key}
                        variant={key in (autoApplied ?? {}) ? 'secondary' : 'default'}
                        className="text-xs capitalize"
                      >
                        {key}: {value} {key in (autoApplied ?? {}) ? '(default)' : '(user)'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {defaultsPairs.length > 0 && (
                <div>
                  <p className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Defaults suggested</p>
                  <div className="flex flex-wrap gap-2">
                    {defaultsPairs.map(([key, value]) => (
                      <Badge key={key} className="text-xs capitalize">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(autoApplied ?? {}).length > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Defaults already applied: {Object.keys(autoApplied ?? {}).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

        <div className="mt-4">
          {renderOptions()}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={onSubmit}
            disabled={
              loading ||
              disableInputs ||
              (requiresInteraction && selectedValues.length === 0)
            }
            className="min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : suggestion.selector.kind === 'none' ? (
              'Continue'
            ) : (
              'Submit'
            )}
          </Button>

          {showAcceptDefaults && onAcceptDefaults && (
            <Button
              type="button"
              variant="outline"
              onClick={onAcceptDefaults}
              disabled={loading || disableInputs}
            >
              Accept defaults
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClarificationQuestionCard;
