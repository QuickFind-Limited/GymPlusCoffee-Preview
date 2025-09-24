export type SelectorKind = 'single_select' | 'multi_select' | 'none';

export interface SelectorMetadata {
  kind: SelectorKind;
  style?: string | null;
  raw?: string | null;
}

export interface ClarificationOption {
  value: string;
  display_value: string;
  links: string[];
}

export interface ClarificationSuggestion {
  question_id: string;
  clarification_question: string;
  selector: SelectorMetadata;
  options: ClarificationOption[];
  defaults_applied: Record<string, string>;
  context_tags: string[];
  reason: string;
}

export interface ClarificationSessionState {
  session_id: string;
  original_query: string;
  auto_applied: Record<string, string>;
  answers: Record<string, string[]>;
  pending: ClarificationSuggestion[];
  matched_question_ids: string[];
  resolved_context: Record<string, string>;
  status: 'pending' | 'ready';
  updated_at: string;
}

export interface ClarificationAnswerPayload {
  question_id: string;
  selected_values: string[];
}

export interface ClarificationAnswerRequest {
  session_id: string;
  answers?: ClarificationAnswerPayload[];
  accept_defaults?: boolean;
}

export interface SystemWideQueryDefinition {
  query_id: string;
  section: string;
  title: string;
  description: string;
  sql: string;
}

export interface SystemWideQueryResult {
  query_id: string;
  collected_at: string;
  row_count: number;
  rows: Array<Record<string, unknown>>;
}

export interface SystemDefaultsResponse {
  definitions: SystemWideQueryDefinition[];
  results: Record<string, SystemWideQueryResult>;
}
