import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export class RulesGenerator {
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  public generate(options: { type: string }): void {
    const type = options.type.toLowerCase();

    if (type === 'all' || type === 'cursor') {
      this.generateCursorRules();
    }
    if (type === 'all' || type === 'cline') {
      this.generateClineRules();
    }
  }

  private generateCursorRules(): void {
    const filePath = path.join(this.projectPath, '.cursorrules');
    const content = `# Reglas de Arquitectura y Desarrollo ASAF para Cursor 🤖📐

Estás trabajando en un proyecto regulado por el AI Software Architect Framework (ASAF).
Debes seguir estrictamente las directrices del framework en cada cambio.

## 📋 Reglas Generales
1. **Verificación de ADRs**: Antes de proponer o implementar cualquier cambio arquitectónico, debes leer los ADRs (Architecture Decision Records) actuales ubicados en \`docs/adr/\` y el índice principal en \`docs/adr/README.md\`.
2. **Contexto Acotado**: Si necesitas analizar el impacto de tus cambios en el repositorio o encontrar qué archivos están directamente afectados, utiliza el CLI ejecutando:
   \`\`\`bash
   npm run dev -- context
   \`\`\`
3. **Consumo Eficiente de Tokens**: Evita leer archivos de código enteros si solo necesitas entender su firma. Pide al usuario que ejecute o usa el contexto resumido que genera ASAF.
4. **Respeto a las Directrices**: No implementes patrones que entren en contradicción con las decisiones registradas en los ADRs sin consultarlo con el usuario.

## 🛠️ Tecnologías del Proyecto
Consulta el archivo \`asaf.json\` en la raíz para conocer el perfil del negocio y el stack seleccionado.
`;

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(chalk.green(`✓ Archivo creado: ${path.relative(this.projectPath, filePath)}`));
  }

  private generateClineRules(): void {
    const filePath = path.join(this.projectPath, '.clinerules');
    const content = `# Reglas de Arquitectura y Desarrollo ASAF para Cline 🤖📐

Estás operando como un agente autónomo de desarrollo en un proyecto gestionado por el AI Software Architect Framework (ASAF).

## 🧭 Directrices de Comportamiento
1. **Consultar ADRs primero**: Antes de cualquier tarea de código, consulta \`docs/adr/\` para conocer las tecnologías aprobadas, justificaciones, pros/contras y decisiones de diseño del proyecto.
2. **Usa ASAF CLI**:
   - Para entender el grafo de dependencias de importación: ejecuta \`npm run dev -- analyze\` y revisa \`asaf-graph.json\`.
   - Para obtener la lista de impacto de los cambios actuales: ejecuta \`npm run dev -- context\`.
3. **Optimización de Tokens**: Prefiere el slicing de código. No leas clases o archivos de más de 300 líneas de manera redundante si ya sabes qué firmas exponen.
4. **Cumplimiento de Estilo**: Sigue las directrices del rol y checklist especificado en \`asaf.json\` o el pool de agentes de ASAF (\`npm run dev -- agents\`).
`;

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(chalk.green(`✓ Archivo creado: ${path.relative(this.projectPath, filePath)}`));
  }
}
