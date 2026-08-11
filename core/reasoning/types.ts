export interface ContextEvidence {
  type:
    | 'graph_relation'
    | 'git_change'
    | 'semantic_match'
    | 'governance_rule'
    | 'adr_reference';
  description: string;
  nodeId?: string;
  sourceNode?: string;
  targetNode?: string;
  relation?: string;
  path?: string[];
  distance?: number;
  confidence?: number;
}

export interface TaskIntent {
  task: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REFACTOR' | 'FIX' | 'UNKNOWN';
  concepts: string[];
  technicalAreas: string[];
  probableArtifacts: string[];
  confidence: number;
}

export interface ResolvedTarget {
  id: string; // File o Symbol
  source: 'explicit' | 'git' | 'semantic' | 'graph';
  confidence: number;
  confidenceSource: 'structural' | 'semantic' | 'git' | 'heuristic';
  evidence?: ContextEvidence[];
}

export interface TestImpact {
  testFile: string;
  target: string;
  classification: 'DIRECT' | 'INDIRECT';
  distance: number;
  path: string[];
  confidence: number;
  reason: string;
}

export type RiskOrigin = 'EXISTING' | 'PROJECTED';

export interface RiskItem {
  id: string;
  category:
    | 'FAN_IN'
    | 'FAN_OUT'
    | 'DATABASE'
    | 'API'
    | 'BOUNDARY'
    | 'GOVERNANCE'
    | 'MISSING_TEST'
    | 'ADR_CONFLICT';
  score: number;       // Score acumulado resultante en esa categoría
  contribution: number; // El valor que aportó (+20, -10, etc.)
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  origin: RiskOrigin;
  evidence: ContextEvidence[];
}

export interface ChangeItem {
  path: string;
  action: 'CREATE' | 'MODIFY' | 'DELETE' | 'TEST' | 'REVIEW';
  priority: number;
  reason: string;
  dependencies: string[];
  evidence: ContextEvidence[];
}

export interface ADRAffect {
  adrId: string;
  title: string;
  status: string;
  reason: string;
  impactType: 'GOVERNS' | 'CONFLICTS' | 'INFORMATIONAL';
}

export interface GovernanceViolation {
  ruleId: string;
  description: string;
  severity: 'warning' | 'error';
  target: string;
  reason: string;
}

export interface Recommendation {
  id: string;
  text: string;
  priority: number;
  evidence: ContextEvidence[];
}

export interface ChangePlan {
  task: string;
  intent: TaskIntent;
  targets: string[];
  summary: {
    changeType: 'CREATE' | 'UPDATE' | 'REFACTOR' | 'DELETE' | 'UNKNOWN';
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;
  };
  changes: ChangeItem[];
  impact: {
    affectedNodes: string[];
    dependencies: string[];
    dependents: string[];
    boundariesCrossed: string[];
  };
  tests: {
    affected: TestImpact[];
    recommended: string[];
    missing: string[]; // Con enfoque "no se encontró evidencia de cobertura de test"
  };
  risks: RiskItem[];
  architecture: {
    violations: GovernanceViolation[];
    affectedADRs: ADRAffect[];
    conflicts: string[];
  };
  evidence: ContextEvidence[];
  recommendations: Recommendation[];
}
