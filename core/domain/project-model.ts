export interface ProjectMetadata {
  name: string;
  version: string;
  path: string;
}

export interface FileNode {
  path: string;
  hash: string;
  size: number;
}

export interface ModuleNode {
  name: string;
  path: string;
}

export interface SymbolNode {
  id: string;
  name: string;
  type: 'class' | 'function' | 'interface' | 'variable' | 'enum' | 'type';
  filePath: string;
  line: number;
}

export type RelationType =
  | 'imports'
  | 'exports'
  | 'calls'
  | 'extends'
  | 'implements'
  | 'injects'
  | 'references'
  | 'contains'
  | 'exposes'
  | 'queries'
  | 'tested-by'
  | 'governed-by'
  | 'supersedes';

export interface Relation {
  from: string;
  to: string;
  type: RelationType;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handlerSymbol: string;
}

export interface DatabaseReference {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  file: string;
}

export interface TestReference {
  testFile: string;
  targetFile: string;
  coverage: number;
}

export interface DependencyReference {
  name: string;
  version: string;
  type: 'prod' | 'dev';
}

export interface ArchitectureModel {
  layers: string[];
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  date?: string;
  context?: string;
  decision?: string;
  consequences?: string;
  file: string;
  supersedes?: string[];
  supersededBy?: string;
  tags?: string[];
}

export interface IndexDiagnostic {
  file: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface IndexMetadata {
  schemaVersion: number;
  indexerVersion: string;
  createdAt: string;
  updatedAt: string;
  diagnostics: IndexDiagnostic[];
}

export interface GitModel {
  indexedCommit: string;
  headCommit: string;
  branch?: string;
  changedFilesSinceLastIndex: string[];
  indexTimestamp: string;
  isDirty: boolean;
}

export interface ProjectModel {
  project: ProjectMetadata;
  indexMetadata: IndexMetadata;
  files: FileNode[];
  modules: ModuleNode[];
  symbols: SymbolNode[];
  relations: Relation[];
  apis: ApiEndpoint[];
  databases: DatabaseReference[];
  tests: TestReference[];
  dependencies: DependencyReference[];
  architecture: ArchitectureModel;
  decisions: ArchitectureDecision[];
  git: GitModel;
}
