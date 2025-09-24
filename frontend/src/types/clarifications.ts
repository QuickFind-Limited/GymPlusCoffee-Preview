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

export interface ClarificationResponse {
  user_query: string;
  suggestions: ClarificationSuggestion[];
  auto_applied: Record<string, string>;
  evaluated_at: string;
  matched_question_ids: string[];
}

export interface ClarificationRequest {
  user_query: string;
  module_hint?: string | null;
  already_provided?: Record<string, string>;
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
