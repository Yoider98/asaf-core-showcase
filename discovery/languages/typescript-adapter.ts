import * as ts from 'typescript';
import { LanguageAdapter, AnalysisResult } from '../core/adapter';
import { ClassMetadata } from '../index';

export class TypeScriptAdapter implements LanguageAdapter {
  public canAnalyze(filename: string): boolean {
    const ext = filename.toLowerCase();
    return ext.endsWith('.ts') || ext.endsWith('.js');
  }

  public analyze(filePath: string, content: string): AnalysisResult {
    const imports: string[] = [];
    const classes: ClassMetadata[] = [];

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node: ts.Node) => {
      // 1. Capturar importaciones
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text);
        }
      }

      // 2. Capturar require/CommonJS
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const call = node.initializer;
        if (ts.isIdentifier(call.expression) && call.expression.text === 'require') {
          const arg = call.arguments[0];
          if (arg && ts.isStringLiteral(arg)) {
            imports.push(arg.text);
          }
        }
      }

      // 3. Capturar Clases
      if (ts.isClassDeclaration(node)) {
        const className = node.name ? node.name.text : 'AnonymousClass';
        const methods: string[] = [];
        const decorators: string[] = [];
        const injectedDependencies: string[] = [];
        const implementsInterfaces: string[] = [];

        if (node.modifiers) {
          node.modifiers.forEach(modifier => {
            if (ts.isDecorator(modifier)) {
              const expr = modifier.expression;
              if (ts.isIdentifier(expr)) {
                decorators.push(expr.text);
              } else if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
                decorators.push(expr.expression.text);
              }
            }
          });
        }

        if (node.heritageClauses) {
          node.heritageClauses.forEach(clause => {
            if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
              clause.types.forEach(t => {
                if (ts.isIdentifier(t.expression)) {
                  implementsInterfaces.push(t.expression.text);
                }
              });
            }
          });
        }

        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member) && member.name) {
            if (ts.isIdentifier(member.name)) {
              methods.push(member.name.text);
            }
          }

          if (ts.isConstructorDeclaration(member)) {
            member.parameters.forEach(param => {
              if (param.type && ts.isTypeReferenceNode(param.type)) {
                if (ts.isIdentifier(param.type.typeName)) {
                  injectedDependencies.push(param.type.typeName.text);
                }
              }
            });
          }
        });

        classes.push({
          name: className,
          methods,
          decorators,
          injectedDependencies,
          implementsInterfaces
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return { imports, classes };
  }
}
