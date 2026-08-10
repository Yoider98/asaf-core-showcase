import { ArchitectureDecision } from './project-model';
import { ImpactEdge } from './impact';

export interface ADRAffect {
  id: string;
  title: string;
  status: string;
  reason: string;
  evidence: {
    path: string[];
    relations: ImpactEdge[];
  };
}

export interface ADRConsistencyReport {
  isValid: boolean;
  issues: string[];
}

export interface ADRIntelligenceEngine {
  getADR(id: string): ArchitectureDecision | undefined;
  listADRs(): ArchitectureDecision[];
  findRelatedNodes(adrId: string): string[];
  findAffectedADRs(nodeId: string, affectedNodes?: string[]): ADRAffect[];
  findSupersededADRs(): ArchitectureDecision[];
  validateADRConsistency(): ADRConsistencyReport;
}
