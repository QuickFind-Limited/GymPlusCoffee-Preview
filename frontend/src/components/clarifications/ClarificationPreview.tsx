import { ClarificationSessionState, SelectorKind } from '@/types/clarifications';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface ClarificationPreviewProps {
  session?: ClarificationSessionState | null;
  loading?: boolean;
  error?: string | null;
  selections: Record<string, string[]>;
  onChange: (questionId: string, values: string[]) => void;
  onSubmit: () => void;
  onAcceptDefaults: () => void;
}

const kindLabel: Record<SelectorKind, string> = {
  single_select: 'Select one option',
  multi_select: 'Select all that apply',
  none: 'No clarification required',
};

export function ClarificationPreview({
  session,
  loading,
  error,
  selections,
  onChange,
  onSubmit,
  onAcceptDefaults,
}: ClarificationPreviewProps) {
  const hasContent = loading || error || session;
  const pendingCount = session?.pending.length ?? 0;

  const resolvedPairs = useMemo(() => {
    if (!session) return [] as Array<{ key: string; value: string; source: 'user' | 'default' }>;
    return Object.entries(session.resolved_context).map(([key, value]) => ({
      key,
      value,
      source: key in session.auto_applied ? 'default' : 'user',
    }));
  }, [session]);

  if (!hasContent) {
    return null;
  }

  const disableInputs = session?.status === 'ready' || !session;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Clarification Workflow
          </h3>
          {session && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Session {session.session_id.slice(0, 8)} • status: {session.status}
            </p>
          )}
        </div>
        {session && pendingCount > 0 && !disableInputs && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onAcceptDefaults}>
              Accept defaults
            </Button>
            <Button size="sm" onClick={onSubmit}>
              Submit answers
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Evaluating clarification dataset…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : session ? (
        <div className="space-y-4">
          {resolvedPairs.length > 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <p className="mb-2 font-semibold">Resolved context</p>
              <div className="flex flex-wrap gap-2">
                {resolvedPairs.map(({ key, value, source }) => (
                  <Badge
                    key={key}
                    variant={source === 'user' ? 'default' : 'secondary'}
                    className="text-xs capitalize"
                  >
                    {key}: {value} {source === 'default' ? '(default)' : '(user)'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {pendingCount === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              <Check className="h-4 w-4" />
              All clarifications satisfied.
            </div>
          ) : (
            session.pending.map((suggestion) => {
              const selectedValues = selections[suggestion.question_id] || [];
              const handleSelection = (value: string, checked: boolean) => {
                if (suggestion.selector.kind === 'single_select') {
                  onChange(suggestion.question_id, [value]);
                } else {
                  const next = new Set(selectedValues);
                  if (checked) {
                    next.add(value);
                  } else {
                    next.delete(value);
                  }
                  onChange(suggestion.question_id, Array.from(next));
                }
              };

              return (
                <div
                  key={suggestion.question_id}
                  className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {suggestion.clarification_question}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {kindLabel[suggestion.selector.kind]}
                    </span>
                  </div>

                  {suggestion.reason && (
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.reason}
                    </p>
                  )}

                  {suggestion.selector.kind === 'none' ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No interaction required — defaults satisfy this context.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {suggestion.options.map((option) => {
                        const isChecked = selectedValues.includes(option.display_value) || selectedValues.includes(option.value);
                        return (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            {suggestion.selector.kind === 'single_select' ? (
                              <input
                                type="radio"
                                name={suggestion.question_id}
                                value={option.value}
                                disabled={disableInputs}
                                checked={isChecked}
                                onChange={(event) => handleSelection(option.display_value || option.value, event.target.checked)}
                                className="h-4 w-4"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                value={option.value}
                                disabled={disableInputs}
                                checked={isChecked}
                                onChange={(event) => handleSelection(option.display_value || option.value, event.target.checked)}
                                className="h-4 w-4"
                              />
                            )}
                            <span>{option.display_value}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
