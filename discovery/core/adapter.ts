import { ClassMetadata } from '../index';

export interface AnalysisResult {
  imports: string[];
  classes: ClassMetadata[];
  // Campos preparados para futuras iteraciones
  functions?: string[];
  exports?: string[];
}

export interface LanguageAdapter {
  canAnalyze(filename: string): boolean;
  analyze(filePath: string, content: string): AnalysisResult;
}
