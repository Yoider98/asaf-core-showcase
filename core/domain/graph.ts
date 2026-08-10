import { Relation, RelationType } from './project-model';

export interface GraphNode {
  id: string;
  type: 'file' | 'module' | 'symbol' | 'api' | 'database' | 'test';
  label: string;
}

export interface GraphPath {
  nodes: string[];
  relations: Relation[];
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  fanIn: { [key: string]: number };
  fanOut: { [key: string]: number };
  cycles: string[][];
}

export interface GraphQueryOptions {
  depth?: number | 'all';
  relationTypes?: RelationType[];
}

export interface GraphQueryEngine {
  getNode(id: string): GraphNode | null;
  getDependencies(nodeId: string, options?: GraphQueryOptions): string[];
  getDependents(nodeId: string, options?: GraphQueryOptions): string[];
  getRelations(nodeId: string): Relation[];
  findPath(from: string, to: string, options?: GraphQueryOptions): GraphPath | null;
  calculateMetrics(): GraphMetrics;
  getDependenciesWithDistance(nodeId: string, maxDepth?: number): any[];
  getDependentsWithDistance(nodeId: string, maxDepth?: number): any[];
}
