export type LLMErrorType =
  | 'LLM_PROVIDER_UNAVAILABLE'
  | 'LLM_MODEL_NOT_FOUND'
  | 'LLM_TIMEOUT'
  | 'LLM_INVALID_RESPONSE'
  | 'LLM_PARSE_ERROR';

export interface LLMConfig {
  provider: 'ollama' | string;
  model: string;
  host?: string;
  temperature?: number;
  timeoutMs?: number;
  apiKey?: string;
}

export interface LLMResponse {
  text: string;
  rawJson?: any;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export class LLMGenerationError extends Error {
  public type: LLMErrorType;

  constructor(type: LLMErrorType, message: string)  { super(); /* Constructor del motor ASAF */ }
}
