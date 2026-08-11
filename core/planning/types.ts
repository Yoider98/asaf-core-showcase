import { ChangePlan } from '../reasoning/types';
import { RiskLevel } from '../execution/types';

export interface PlanningEvidence {
  type:
    | 'graph_relation'
    | 'git_change'
    | 'semantic_match'
    | 'governance_rule'
    | 'adr_reference'
    | 'existing_file'
    | 'existing_symbol'
    | 'change_plan'
    | 'test_impact'
    | 'governance'
    | 'adr'
    | 'git';
  description: string;
  sourceNode?: string;
  targetNode?: string;
  relation?: string;
  path?: string[];
  distance?: number;
  confidence: number;
}

export type DeltaItemType = 'FILE' | 'SYMBOL' | 'MODULE' | 'BOUNDARY';
export type DeltaItemStatus = 'PROJECTED' | 'OBSERVED' | 'UNKNOWN';

export interface ArchitectureDeltaItem {
  id: string;
  type: DeltaItemType;
  status: DeltaItemStatus;
  reason: string;
  evidence: PlanningEvidence[];
}

export interface ArchitectureRelationDelta {
  from: string;
  to: string;
  type: string;
  status: DeltaItemStatus;
  evidence: PlanningEvidence[];
}

export interface ArchitectureDelta {
  addedNodes: ArchitectureDeltaItem[];
  removedNodes: ArchitectureDeltaItem[];
  modifiedNodes: ArchitectureDeltaItem[];
  addedRelations: ArchitectureRelationDelta[];
  removedRelations: ArchitectureRelationDelta[];
  boundariesEntered: string[];
  boundariesExited: string[];
  violationsIntroduced: string[];
  violationsResolved: string[];
  affectedADRs: string[];
  evidence: PlanningEvidence[];
}

export interface ChangeGraphNode {
  id: string;
  path: string;
  action: 'CREATE' | 'MODIFY' | 'DELETE' | 'TEST' | 'REVIEW';
  priority: number;
  dependencies: string[];
  dependents: string[];
  evidence: PlanningEvidence[];
}

export interface ChangeGraph {
  nodes: ChangeGraphNode[];
  edges: {
    from: string;
    to: string;
    reason: string;
    evidence: PlanningEvidence[];
  }[];
  hasCycle: boolean;
  cycleNodes: string[];
  topologicalOrder: string[];
}

export interface TestPlanItem {
  testFile: string;
  target: string;
  priority: number;
  reason: string;
  evidence: PlanningEvidence[];
}

export interface TestStrategy {
  mustRun: TestPlanItem[];
  shouldRun: TestPlanItem[];
  recommendedToCreate: TestPlanItem[];
  missingCoverage: TestPlanItem[];
  blocked: TestPlanItem[];
}

export interface ExecutionStep {
  id: string;
  order: number;
  action: 'CREATE' | 'MODIFY' | 'DELETE' | 'TEST' | 'REVIEW';
  target: string;
  dependsOn: string[];
  priority: number;
  rationale: string;
  evidence: PlanningEvidence[];
  validation: string[];
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  parallelGroups: string[][];
  blocked: string[];
  hasCycle: boolean;
  evidence: PlanningEvidence[];
}

export interface PlanningMetrics {
  graphNodes: number;
  graphEdges: number;
  changes: number;
  affectedTests: number;
  missingTests: number;
  boundariesCrossed: number;
  risks: number;
  evidenceCount: number;
  planningTimeMs?: number;
}

export interface PlanningSummary {
  changeType: 'CREATE' | 'UPDATE' | 'REFACTOR' | 'DELETE' | 'UNKNOWN';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  riskLevel: RiskLevel;
  hasCycle: boolean;
  metrics: PlanningMetrics;
}

export interface PlanningResult {
  changePlan: ChangePlan;
  architectureDelta: ArchitectureDelta;
  changeGraph: ChangeGraph;
  testStrategy: TestStrategy;
  executionPlan: ExecutionPlan;
  summary: PlanningSummary;
  evidence: PlanningEvidence[];
}
export interface PlanningResult {
  changePlan: ChangePlan;
  architectureDelta: ArchitectureDelta;
  changeGraph: ChangeGraph;
  testStrategy: TestStrategy;
  executionPlan: ExecutionPlan;
  summary: PlanningSummary;
  evidence: PlanningEvidence[];
}
