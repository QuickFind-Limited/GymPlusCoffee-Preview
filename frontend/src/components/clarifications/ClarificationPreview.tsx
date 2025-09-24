import { ClarificationResponse, SelectorKind } from '@/types/clarifications';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClarificationPreviewProps {
  response?: ClarificationResponse | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const kindLabel: Record<SelectorKind, string> = {
  single_select: 'Select one option',
  multi_select: 'Select all that apply',
  none: 'No clarification required',
};

export function ClarificationPreview({
  response,
  loading,
  error,
  onRetry,
}: ClarificationPreviewProps) {
  const hasContent =
    loading || error || (response && (response.suggestions.length > 0 || Object.keys(response.auto_applied).length > 0));

  if (!hasContent) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Clarification Suggestions
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Deterministic gate + global defaults (last evaluated {response?.evaluated_at || 'now'})
          </p>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-xs"
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
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
      ) : (
        <div className="space-y-3">
          {response && Object.keys(response.auto_applied).length > 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <p className="font-medium">Auto-applied context</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {Object.entries(response.auto_applied).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-semibold capitalize">{key}:</span> {value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {response && response.suggestions.length > 0 ? (
            response.suggestions.map((suggestion) => (
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
                    {suggestion.selector.kind === 'single_select' ? (
                      <div className="space-y-1">
                        {suggestion.options.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gray-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            </span>
                            <span>{option.display_value}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {suggestion.options.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="flex h-3.5 w-3.5 items-center justify-center rounded border border-gray-400">
                              <span className="h-2 w-2 rounded bg-gray-400" />
                            </span>
                            <span>{option.display_value}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {Object.keys(suggestion.defaults_applied).length > 0 && (
                  <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <p className="font-medium">Suggested defaults</p>
                    <ul className="mt-1 space-y-1">
                      {Object.entries(suggestion.defaults_applied).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-semibold capitalize">{key}:</span> {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No clarifications required for this prompt.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
