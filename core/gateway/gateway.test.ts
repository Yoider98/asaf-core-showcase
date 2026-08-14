import { ASAFGateway } from './gateway';
import { ASAFIntentRouter } from './intent-router';
import { DelegationPolicy, DelegationMode } from './delegation-policy';
import { ASAFContextCache } from './context-cache';
import { IDEBridgeRegistry } from './bridges/ide-bridge';
import './bridges/antigravity-bridge';
import './bridges/cursor-bridge';
import * as fs from 'fs';
import * as path from 'path';

describe('ASAF Universal Cognitive Gateway Tests', () => {
  const sandboxDir = path.resolve(__dirname, 'sandbox_gateway_test');

  beforeAll(() => {
    if (!fs.existsSync(sandboxDir)) {
      fs.mkdirSync(sandboxDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

  test('Fase 1: ASAFIntentRouter deduce intenciones correctamente de tareas naturales', () => {
    const req1 = { requestId: '1', projectId: 'd', intent: 'PLAN' as any, task: 'Generar auth' };
    expect(ASAFIntentRouter.route(req1)).toBe('PLAN');

    const req2 = { requestId: '2', projectId: 'd', task: '¿Cómo funciona el módulo de usuarios?' } as any;
    expect(ASAFIntentRouter.route(req2)).toBe('UNDERSTAND');

    const req3 = { requestId: '3', projectId: 'd', task: 'Qué rompería si modifico la base de datos' } as any;
    expect(ASAFIntentRouter.route(req3)).toBe('IMPACT_ANALYSIS');
  });

  test('Fase 2: DelegationPolicy determina cuándo delegar al Gateway', () => {
    expect(DelegationPolicy.shouldDelegate('UNDERSTAND', DelegationMode.ASAF_FIRST)).toBe(true);
    expect(DelegationPolicy.shouldDelegate('EXECUTE', DelegationMode.IDE_ONLY)).toBe(false);
    expect(DelegationPolicy.shouldDelegate('IMPACT_ANALYSIS', DelegationMode.ASAF_OPTIONAL)).toBe(true);
  });

  test('Fase 3: ASAFContextCache persiste y recupera respuestas', () => {
    const cache = new ASAFContextCache(sandboxDir);
    cache.clear();

    const mockResponse = {
      requestId: 'test-req',
      status: 'SUCCESS' as any,
      intent: 'UNDERSTAND' as any,
      summary: 'Cached summary'
    };

    cache.set('UNDERSTAND', 'Tarea cacheada', mockResponse);

    const hit = cache.get('UNDERSTAND', 'Tarea cacheada');
    expect(hit).toBeDefined();
    expect(hit?.summary).toBe('Cached summary');
  });

  test('Fase 4: IDEBridgeRegistry registra y crea bridges de IDE agnósticos', () => {
    const bridges = IDEBridgeRegistry.getRegisteredBridges();
    expect(bridges).toContain('antigravity');
    expect(bridges).toContain('cursor');

    const cursor = IDEBridgeRegistry.createBridge('cursor');
    expect(cursor).toBeDefined();
    expect(cursor?.id).toBe('cursor');
  });

  test('Fase 5: ASAFGateway bloquea si el indexador no ha corrido', async () => {
    const gateway = new ASAFGateway(sandboxDir);
    const res = await gateway.handle({
      requestId: 'req-1',
      projectId: 'test',
      intent: 'UNDERSTAND',
      task: 'Analiza la arquitectura'
    });

    expect(res.status).toBe('BLOCKED');
    expect(res.summary).toContain('El proyecto no ha sido indexado');
  });
});
