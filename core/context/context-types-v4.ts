export type ContextGranularity = 'FULL' | 'STRUCTURAL' | 'SIGNATURE' | 'MINIMAL';

export interface ContextFilePayload {
  filePath: string;
  status: 'TARGET' | 'CONTEXT';
  granularity: ContextGranularity;
  content: string; // Envuelto en etiquetas de seguridad untrusted
  sizeBytes: number;
  estimatedTokens: number;
}

export interface ContextSymbol {
  name: string;
  type: string;
  filePath: string;
  signature: string;
}

export interface ContextADR {
  id: string;
  title: string;
  status: string;
  recommendation: string;
}

export interface AIContextv4 {
  task: string;
  changePlanSummary: any;
  targetFiles: ContextFilePayload[];
  contextOnlyFiles: ContextFilePayload[];
  symbols: ContextSymbol[];
  dependencies: string[];
  dependents: string[];
  architectureConstraints: string[];
  relevantADRs: ContextADR[];
  relatedTests: string[];
  previousErrors: string[];
  tokenBudget: number;
  tokenUsageEstimate: number;
  contextHash?: string;
}
