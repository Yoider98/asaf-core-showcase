export interface ArchitectureRule {
  id: string;
  name: string;
  type: 'layer-boundary' | 'dependency' | 'naming' | 'custom';
  severity: 'error' | 'warning';
  path: string; // Capa origen
  forbidden: string[]; // Capas prohibidas de importar
  allowed?: string[]; // Si se define, solo se permiten imports de estas capas
  adrId?: string;
}

export interface GovernanceEvidence {
  path: string[];
  relations: {
    from: string;
    to: string;
    type: string;
  }[];
}

export interface GovernanceViolation {
  file: string;
  importedPath: string;
  rule: string;
  severity: 'error' | 'warning';
  adrLink?: string;
  evidence: GovernanceEvidence;
}

export interface GovernanceReport {
  status: 'pass' | 'violations';
  totalRules: number;
  totalFiles: number;
  violations: GovernanceViolation[];
  errors: number;
  warnings: number;
}

export interface GovernanceEngine {
  checkRules(): GovernanceReport;
  findAffectedBoundaries(targetId: string, affectedNodes: string[]): string[];
}
