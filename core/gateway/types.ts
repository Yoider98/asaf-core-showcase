export type ASAFIntent =
  | 'DISCOVER'
  | 'UNDERSTAND'
  | 'ANALYZE'
  | 'IMPACT_ANALYSIS'
  | 'PLAN'
  | 'GENERATE'
  | 'VALIDATE'
  | 'EXECUTE'
  | 'NEXT';

export interface ASAFRequest {
  requestId: string;
  projectId: string;
  intent: ASAFIntent;
  task: string;
  contextId?: string; // Opcional para solicitudes NEXT
  chunkIndex?: number; // Opcional para solicitudes NEXT
  context?: {
    files?: string[];
    symbols?: string[];
    paths?: string[];
    gitRef?: string;
  };
  options?: {
    includeArchitecture?: boolean;
    includeDependencies?: boolean;
    includeTests?: boolean;
    includeImpactAnalysis?: boolean;
    maxContextTokens?: number;
  };
  provider?: {
    preferred?: string;
    strategy?: 'AUTO' | 'STRICT' | 'INTERACTIVE';
  };
}

export interface ASAFTokenEconomy {
  repositoryFiles: number;
  filesInspected: number;
  primaryFilesSelected: number;
  supportingFilesReturned: number;
  totalFilesReturned: number;
  estimatedFullContextTokens: number;
  estimatedSelectedContextTokens: number;
  estimatedTokensAvoided: number;
  budget?: number;
  budgetUsed?: number;
  slicingApplied?: boolean;
  slicingLevels?: Record<string, string>;
  chunksCreated?: number;
  measurement: 'ESTIMATED';
  cacheHit: boolean;
  projectFingerprint?: string;
  contextFingerprint?: string;
}

export interface ASAFResponse {
  requestId: string;
  status: 'SUCCESS' | 'PARTIAL' | 'BLOCKED' | 'ERROR';
  intent: ASAFIntent;
  summary: string;
  contextId?: string; // ID de sesión de chunking
  chunkIndex?: number;
  totalChunks?: number;
  hasMore?: boolean;
  context?: {
    files: string[];
    symbols: string[];
    dependencies: string[];
  };
  architecture?: any;
  impact?: any;
  plan?: any;
  proposal?: any;
  validation?: any;
  diagnostics?: any;
  nextActions?: any[];
  tokenEconomy?: ASAFTokenEconomy;
}

export interface IDECapabilities {
  supportsMCP: boolean;
  supportsCLI: boolean;
  supportsHTTP: boolean;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsWorkspaceContext: boolean;
  supportsFileEditing: boolean;
  supportsTerminal: boolean;
}

export interface IDEIdentity {
  id: string;
  name?: string;
  version?: string;
}

export interface ASAFSession {
  sessionId: string;
  projectId: string;
  startedAt: string;
  lastActivityAt: string;
  ide?: IDEIdentity;
  agent?: {
    id: string;
    name?: string;
  };
  provider?: {
    id: string;
    model?: string;
  };
}

export interface IDEBridge {
  id: string;
  name: string;
  detect(): Promise<boolean>;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  send(request: ASAFRequest): Promise<ASAFResponse>;
  capabilities(): IDECapabilities;
}

export interface ASAFTransport  {
    // La implementación de análisis semántico avanzado de este módulo
    // es privada. Se expone la arquitectura y firmas de ASAF.
    throw new Error("ASAF Showcase: Módulo avanzado no implementado.");
  }
