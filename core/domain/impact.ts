import { Relation } from './project-model';

export interface ImpactEdge {
  from: string;
  to: string;
  type: string;
}

export interface ImpactEvidence {
  from: string;
  to: string;
  distance: number;
  path: string[];
  relations: ImpactEdge[];
}

export interface ImpactItem {
  id: string;
  type: 'file' | 'symbol' | 'api' | 'database' | 'test';
  distance: number;
  evidence: ImpactEvidence;
}

export interface ImpactMetrics {
  fanIn: number;
  fanOut: number;
  affectedNodes: number;
  affectedApis: number;
  affectedDatabases: number;
  affectedTests: number;
  maxDepth: number;
}

export interface RiskAssessment {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}

import { ADRAffect } from './adr';

export interface ImpactReport {
  target: string;
  status: 'success' | 'error' | 'removed-from-index';
  metrics?: ImpactMetrics;
  items?: ImpactItem[];
  risk?: RiskAssessment;
  architectureBoundariesCrossed?: string[];
  affectedADRs?: ADRAffect[];
  error?: string;
}

export interface ImpactEngine {
  analyzeImpact(targetId: string, depth?: number | 'all'): Promise<ImpactReport>;
}
