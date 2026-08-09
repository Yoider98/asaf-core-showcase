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

## 🚨 REGLA CRÍTICA Y OBLIGATORIA (EN CADA PETICIÓN Y TAREA)
1. **Lectura y Cumplimiento de Reglas**: Antes de comenzar CUALQUIER nueva funcionalidad, corrección de bug, refactorización o cualquier interacción, debes leer y cumplir estrictamente estas reglas. No asumas configuraciones anteriores.
2. **Ciclo de Vida de Especificaciones (Specs) Obligatorio**:
   - **Post-Ejecución**: Al finalizar la implementación o cambio de cualquier función o método, es obligatorio crear o actualizar su especificación correspondiente en el archivo de especificaciones (\`.spec.md\`) del módulo modificado (ubicados en \`docs/specs/\`).
   - Si el módulo no posee un archivo spec de especificaciones, debes generar la especificación completa del módulo.
   - **Validación de Seguridad**: Al generar las especificaciones, debes evaluar, validar y documentar explícitamente los aspectos de seguridad del código y su correcto funcionamiento para evitar riesgos potenciales.
3. **Mantenimiento Continuo de la Base de Conocimiento**:
   - Al realizar cualquier modificación, debes actualizar los hashes en \`asaf-hashes.json\` y el reporte de brechas en \`docs/audit-report.md\` si es necesario, ejecutando el comando de auditoría:
     \`\`\`bash
     npm run dev -- audit
     \`\`\`
4. **Consumo de Specs**: Para implementar o crear nuevas características, primero consulta el índice maestro de especificaciones en \`docs/specs/README.md\` para evitar tener que leer todo el código fuente directamente.

## 📋 Reglas Generales
1. **Verificación de ADRs**: Antes de proponer o implementar cualquier cambio arquitectónico, debes leer los ADRs (Architecture Decision Records) actuales ubicados en \`docs/adr/\` y el índice principal en \`docs/adr/README.md\`.
2. **Contexto Acotado**: Si necesitas analizar el impacto de tus cambios en el repositorio o encontrar qué archivos están directamente afectados, utiliza el CLI ejecutando:
   \`\`\`bash
   npm run dev -- context
   \`\`\`
3. **Consumo Eficiente de Tokens**: Evita leer archivos de código enteros si solo necesitas entender su firma. Consulta los archivos de specs primero.
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

## 🚨 REGLA CRÍTICA Y OBLIGATORIA (EN CADA PETICIÓN Y TAREA)
1. **Lectura y Cumplimiento de Reglas**: Antes de comenzar CUALQUIER nueva funcionalidad, corrección de bug, refactorización o cualquier interacción, debes leer y cumplir estrictamente estas reglas. No asumas configuraciones anteriores.
2. **Ciclo de Vida de Especificaciones (Specs) Obligatorio**:
   - **Post-Ejecución**: Al finalizar la implementación o cambio de cualquier función o método, es obligatorio crear o actualizar su especificación correspondiente en el archivo de especificaciones (\`.spec.md\`) del módulo modificado (ubicados en \`docs/specs/\`).
   - Si el módulo no posee un archivo spec de especificaciones, debes generar la especificación completa del módulo.
   - **Validación de Seguridad**: Al generar las especificaciones, debes evaluar, validar y documentar explícitamente los aspectos de seguridad del código y su correcto funcionamiento para evitar riesgos potenciales.
3. **Mantenimiento Continuo de la Base de Conocimiento**:
   - Al realizar cualquier modificación, debes actualizar los hashes en \`asaf-hashes.json\` y el reporte de brechas en \`docs/audit-report.md\` si es necesario, ejecutando el comando de auditoría:
     \`\`\`bash
     npm run dev -- audit
     \`\`\`
4. **Consumo de Specs**: Para implementar o crear nuevas características, primero consulta el índice maestro de especificaciones en \`docs/specs/README.md\` para evitar tener que leer todo el código fuente directamente.

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
