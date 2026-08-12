import * as fs from 'fs';
import * as path from 'path';

const testDir = path.join(__dirname, 'temp_mcp_project');

const mockProjectModel = {
  project: {
    name: 'test-mcp-project',
    version: '1.0.0',
    path: testDir.replace(/\\/g, '/')
  },
  indexMetadata: {
    schemaVersion: 1,
    indexerVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    diagnostics: []
  },
  files: [
    { path: 'src/auth/auth.service.ts', hash: 'h1', size: 100 },
    { path: 'src/auth/auth.controller.ts', hash: 'h2', size: 120 },
    { path: 'src/auth/auth.spec.ts', hash: 'h3', size: 80 }
  ],
  modules: [],
  symbols: [
    { id: 'symbol:AuthService', name: 'AuthService', type: 'class', filePath: 'src/auth/auth.service.ts', line: 1 },
    { id: 'symbol:AuthController', name: 'AuthController', type: 'class', filePath: 'src/auth/auth.controller.ts', line: 5 }
  ],
  relations: [
    { from: 'src/auth/auth.controller.ts', to: 'src/auth/auth.service.ts', type: 'imports' },
    { from: 'src/auth/auth.spec.ts', to: 'src/auth/auth.service.ts', type: 'imports' }
  ],
  apis: [],
  databases: [],
  tests: [],
  dependencies: [],
  architecture: { layers: [] },
  decisions: [],
  git: {
    indexedCommit: 'c1',
    headCommit: 'c1',
    changedFilesSinceLastIndex: [],
    indexTimestamp: new Date().toISOString(),
    isDirty: false
  }
};

describe('MCP Tools: change_plan y test_impact', () => {
  let originalCwd = process.cwd;

  beforeAll(() => {
    // Crear el sandbox del proyecto
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const indexDir = path.join(testDir, '.asaf', 'index');
    fs.mkdirSync(indexDir, { recursive: true });
    fs.writeFileSync(
      path.join(indexDir, 'project.json'),
      JSON.stringify(mockProjectModel, null, 2),
      'utf-8'
    );

    // Mockear process.cwd para que apunte al sandbox
    process.cwd = () => testDir;
  });

  afterAll(() => {
    // Restaurar CWD y limpiar sandbox
    process.cwd = originalCwd;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  const getMcpServer = () => {
    return require('../../mcp/index').default || require('../../mcp/index');
  };

  test('1. Debería exponer la herramienta asaf_create_change_plan', async () => {
    const server = getMcpServer();
    const listHandler = server._requestHandlers.get('tools/list');
    const response = await listHandler({ method: 'tools/list' });
    const tool = response.tools.find((t: any) => t.name === 'asaf_create_change_plan');
    expect(tool).toBeDefined();
    expect(tool.description).toContain('Genera un plan de cambio');
  });

  test('2. Debería exponer la herramienta asaf_test_impact', async () => {
    const server = getMcpServer();
    const listHandler = server._requestHandlers.get('tools/list');
    const response = await listHandler({ method: 'tools/list' });
    const tool = response.tools.find((t: any) => t.name === 'asaf_test_impact');
    expect(tool).toBeDefined();
  });

  test('3. Debería retornar error en asaf_create_change_plan si falta task', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_create_change_plan',
        arguments: {}
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('El parámetro "task" es requerido');
  });

  test('4. Debería ejecutar asaf_create_change_plan exitosamente', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_create_change_plan',
        arguments: {
          task: 'Modificar auth.service.ts'
        }
      }
    });

    expect(result.isError).toBeUndefined();
    const resultObj = JSON.parse(result.content[0].text);
    expect(resultObj.changePlan.task).toBe('Modificar auth.service.ts');
    expect(resultObj.changePlan.targets).toContain('src/auth/auth.service.ts');
    expect(resultObj.executionPlan).toBeDefined();
  });

  test('5. Debería retornar error en asaf_test_impact si falta files', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_test_impact',
        arguments: {}
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('El parámetro "files" es requerido');
  });

  test('6. Debería ejecutar asaf_test_impact exitosamente', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_test_impact',
        arguments: {
          files: ['src/auth/auth.service.ts']
        }
      }
    });

    expect(result.isError).toBeUndefined();
    const report = JSON.parse(result.content[0].text);
    expect(report.recommended).toContain('src/auth/auth.spec.ts');
    expect(report.affected[0].classification).toBe('DIRECT');
  });

  test('7. Debería soportar la combinación de task y files en asaf_create_change_plan', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_create_change_plan',
        arguments: {
          task: 'Hacer refactor',
          files: ['src/auth/auth.controller.ts']
        }
      }
    });

    const resultObj = JSON.parse(result.content[0].text);
    expect(resultObj.changePlan.task).toBe('Hacer refactor');
    expect(resultObj.changePlan.targets).toContain('src/auth/auth.controller.ts');
  });

  test('8. Debería propagar errores de herramientas inexistentes en el CallToolHandler', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_tool_non_existent',
        arguments: {}
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Herramienta no encontrada');
  });

  test('9. Debería retornar error en asaf_create_change_plan si el proyecto no está indexado', async () => {
    const originalCwdGetter = process.cwd;
    process.cwd = () => path.join(testDir, 'non-existent-sub');
    
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_create_change_plan',
        arguments: { task: 't' }
      }
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Proyecto no indexado');
    
    process.cwd = originalCwdGetter;
  });

  test('10. Debería exponer y ejecutar la nueva herramienta asaf_simulate_change', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_simulate_change',
        arguments: {
          task: 'Modificar auth.service.ts'
        }
      }
    });

    expect(result.isError).toBeUndefined();
    const delta = JSON.parse(result.content[0].text);
    expect(delta.modifiedNodes).toBeDefined();
    expect(delta.addedNodes).toBeDefined();
  });

  test('11. Debería exponer y ejecutar la nueva herramienta asaf_test_strategy', async () => {
    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_test_strategy',
        arguments: {
          task: 'Modificar auth.service.ts'
        }
      }
    });

    expect(result.isError).toBeUndefined();
    const strategy = JSON.parse(result.content[0].text);
    expect(strategy.mustRun).toBeDefined();
    expect(strategy.shouldRun).toBeDefined();
  });

  test('12. Debería exponer y ejecutar la nueva herramienta de generación de propuesta asaf_generate_proposal', async () => {
    const { AgentOrchestrator } = require('../../agents/orchestrator');
    
    // Mockear la llamada de orquestación de propuesta
    const mockProposal = {
      id: 'prop-mcp-123',
      changePlanTask: 'refactor service',
      contextHash: 'm-hash',
      promptVersion: 'v0.4.0-mcp-test',
      provider: 'ollama',
      model: 'codegemma',
      patches: [],
      warnings: [],
      createdAt: ''
    };

    jest.spyOn(AgentOrchestrator.prototype, 'orchestrateProposal').mockResolvedValue(mockProposal as any);

    const server = getMcpServer();
    const callHandler = server._requestHandlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'asaf_generate_proposal',
        arguments: {
          task: 'refactor service',
          budget: 30000
        }
      }
    });

    expect(result.isError).toBeUndefined();
    const proposal = JSON.parse(result.content[0].text);
    expect(proposal.id).toBe('prop-mcp-123');
    expect(proposal.changePlanTask).toBe('refactor service');
  });
});
