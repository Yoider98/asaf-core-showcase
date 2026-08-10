import { ImpactItem, ImpactMetrics, RiskAssessment, ImpactEdge } from '../domain/impact';
import { ADRAffect } from '../domain/adr';
import { GovernanceViolation } from '../domain/governance';

export type SliceLevel = 'FULL' | 'STRUCTURAL' | 'SIGNATURE' | 'MINIMAL' | 'EXCLUDE';

export interface CodeSlice {
  filePath: string;
  originalSize: number;
  slicedSize: number;
  estimatedTokens: number;
  level: SliceLevel;
  content: string;
}

export interface ContextEvidence {
  claim: string;
  path: string[];
  relations: ImpactEdge[];
}

export interface RankedContextItem {
  id: string;
  type: 'file' | 'symbol' | 'adr' | 'rule';
  priority: number;
  reason: string;
  distance?: number;
  source: 'target' | 'dependency' | 'dependent' | 'symbol' | 'test' | 'adr';
}

export interface AIContext {
  task: string;
  target: {
    nodes: string[];
    files: string[];
    symbols: string[];
  };
  impact: {
    items: ImpactItem[];
    metrics: ImpactMetrics;
    risk?: RiskAssessment;
  };
  architecture: {
    boundariesCrossed: string[];
    violations: GovernanceViolation[];
  };
  decisions: ADRAffect[];
  dependencies: {
    dependencies: string[];
    dependents: string[];
  };
  tests: string[];
  codeSlices: CodeSlice[];
  evidence: ContextEvidence[];
  budget: {
    requested: number;
    available: number;
    estimatedBeforeSelection: number;
    estimatedAfterSlicing: number;
    selected: number;
    utilization: number;
  };
  explain?: RankedContextItem[];
}

export interface ContextEngineOptions {
  task?: string;
  files?: string[];
  budget?: number;
  explain?: boolean;
}
