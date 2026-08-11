export type HashAlgorithm = 'sha256';

export interface FileHash {
  algorithm: HashAlgorithm;
  value: string;
}

export type FileAction = 'CREATE' | 'MODIFY' | 'DELETE';

export interface FilePatch {
  filePath: string;
  action: FileAction;
  expectedHashBefore: string | null; // null si es CREATE
  content?: string;                  // Para sobreescritura/creación directa
  patch?: string;                    // Formato diff estándar
}

export type ExecutionSessionStatus =
  | 'CREATED'
  | 'SNAPSHOTTED'
  | 'EXECUTING'
  | 'VALIDATING'
  | 'COMMITTED'
  | 'ROLLED_BACK'
  | 'RECOVERING'
  | 'RESUMABLE'
  | 'FAILED_RECOVERY';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExecutionSession {
  sessionId: string;
  status: ExecutionSessionStatus;
  dryRun: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  policyApplied: string;
  journal: ExecutionJournalEntry[];
  validation?: ValidationResult;
  rollbackAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string; // Expiración obligatoria para evitar sesiones huérfanas
}

export interface ExecutionJournalEntry {
  path: string;
  operation: FileAction;
  hashBefore: string | null;
  hashAfter: string | null;
  timestamp: string;
}

export interface ScopeValidation {
  declared: string[];
  modified: string[];
  unexpected: string[];
  expanded: string[];
}

export interface ValidationResult {
  passed: boolean;
  context: {
    beforeHash: string;
    afterHash: string;
  };
  metrics: {
    compileTimeMs?: number;
    testTimeMs?: number;
  };
  checks: {
    build: boolean;
    tests: boolean;
    graph: boolean;
    governance: boolean;
    adr: boolean;
    scope: boolean;
    hashIntegrity: boolean;
    git: boolean;
  };
  errors: string[];
}
