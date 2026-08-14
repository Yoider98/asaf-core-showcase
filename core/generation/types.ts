export type LLMErrorType =
  | 'LLM_PROVIDER_UNAVAILABLE'
  | 'LLM_MODEL_NOT_FOUND'
  | 'LLM_TIMEOUT'
  | 'LLM_INVALID_RESPONSE'
  | 'LLM_PARSE_ERROR'
  | 'LLM_AUTH_ERROR'
  | 'LLM_RATE_LIMIT'
  | 'LLM_INTERNAL_ERROR';

export type ProviderStatus = 
  | 'AVAILABLE' 
  | 'NOT_CONFIGURED' 
  | 'UNAVAILABLE' 
  | 'AUTH_ERROR' 
  | 'UNSUPPORTED' 
  | 'DISCOVERED' 
  | 'AUTH_REQUIRED'
  | 'MANUAL_ACTION_REQUIRED'
  | 'WAITING_FOR_USER'
  | 'ERROR';

export interface DiagnosticBlocker {
  code: string;
  title: string;
  description: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ManualAction {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  command?: string;
  requiresRestart?: boolean;
  verificationDescription?: string;
}

export interface RecoveryActionResult {
  success: boolean;
  message: string;
  retryDiscovery: boolean;
}

export interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  automated: boolean;
  requiresUser: boolean;
  execute?: () => Promise<RecoveryActionResult>;
}

export interface DiagnosticCheck {
  label: string;
  status: 'PASS' | 'FAIL' | 'WAIT';
}

export interface ProviderDiagnostic {
  providerId: string;
  status: ProviderStatus;
  installed: boolean;
  configured: boolean;
  authenticated?: boolean;
  reachable?: boolean;
  summary: string;
  blockers: DiagnosticBlocker[];
  manualActions: ManualAction[];
  retryable: boolean;
  requiresUserAction: boolean;
  checks: DiagnosticCheck[];
  recoveryActions: RecoveryAction[];
  whatAsafCanDo: string[];
  whatAsafCannotDo: string[];
}

export interface IDEAgentCapabilities {
  contextAware: boolean;
  toolCalling: boolean;
  requiresIdeSession?: boolean;
  requiresWorkspace?: boolean;
  supportsHeadlessConnection?: boolean;
  supportsInteractiveSetup?: boolean;
}

export interface ProviderDescriptor {
  id: string;
  name: string;
  type: 'IDE_AGENT' | 'LOCAL_MODEL' | 'CLOUD_API' | 'EXTERNAL_AGENT';
  model: string;
  version?: string;
  capabilities: IDEAgentCapabilities;
  configured: boolean;
  available: boolean;
  status: ProviderStatus;
  statusMessage?: string;
  diagnostic?: ProviderDiagnostic;
}

export interface LLMConfig {
  provider: string;
  model: string;
  host?: string;
  temperature?: number;
  timeoutMs?: number;
  apiKey?: string;
  strategy?: {
    preferred: string[];
    fallback: string[];
  };
  mode?: 'auto' | 'interactive' | 'strict';
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
