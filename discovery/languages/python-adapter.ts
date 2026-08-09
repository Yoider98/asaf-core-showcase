import { LanguageAdapter, AnalysisResult } from '../core/adapter';
import { ClassMetadata } from '../index';

export class PythonAdapter implements LanguageAdapter {
  public canAnalyze(filename: string): boolean {
    return filename.toLowerCase().endsWith('.py');
  }

  public analyze(filePath: string, content: string): AnalysisResult {
    const imports: string[] = [];
    const classes: ClassMetadata[] = [];

    const importRegex = /^\s*(?:import\s+([\w\d_, ]+)|from\s+([\w\d_.]+)\s+import\s+([\w\d_, *()]+))/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        match[1].split(',').forEach(imp => imports.push(imp.trim()));
      } else if (match[2]) {
        imports.push(match[2].trim());
      }
    }

    const classLines = content.split('\n');
    let currentClass: ClassMetadata | null = null;

    classLines.forEach(line => {
      const classMatch = line.match(/^\s*class\s+([\w\d_]+)(?:\(([\w\d_, ]+)\))?\s*:/);
      if (classMatch) {
        if (currentClass) {
          classes.push(currentClass);
        }
        currentClass = {
          name: classMatch[1],
          methods: [],
          decorators: [],
          injectedDependencies: [],
          implementsInterfaces: classMatch[2] ? classMatch[2].split(',').map(i => i.trim()) : []
        };
      }

      if (currentClass) {
        const methodMatch = line.match(/^\s+def\s+([\w\d_]+)\s*\(/);
        if (methodMatch) {
          currentClass.methods.push(methodMatch[1]);
        }
      }
    });

    if (currentClass) {
      classes.push(currentClass);
    }

    return { imports, classes };
  }
}
