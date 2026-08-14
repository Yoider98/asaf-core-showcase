import { IDEAgentRegistry } from './ide-agent-registry';
import { LLMProviderRouter } from './llm-router';
import { LLMConfig } from './types';
import './providers/ide/cursor-provider';
import './providers/ide/antigravity-provider';
import './providers/mock-provider';

describe('Universal IDE Agents Architecture Tests', () => {
  test('Should list registered agents in IDEAgentRegistry', () => {
    const agents = IDEAgentRegistry.getRegisteredAgents();
    expect(agents).toContain('antigravity');
    expect(agents).toContain('cursor');
  });

  test('Should create instance of CursorProvider and AntigravityProvider', () => {
    const cursor = IDEAgentRegistry.createAgent('cursor', { provider: 'cursor', model: 'test' });
    const anti = IDEAgentRegistry.createAgent('antigravity', { provider: 'antigravity', model: 'test' });
    
    expect(cursor).toBeDefined();
    expect(anti).toBeDefined();
  });

  test('Should report UNSUPPORTED for CursorProvider when not configured', async () => {
    const cursor = IDEAgentRegistry.createAgent('cursor', { provider: 'cursor', model: 'test' })!;
    const desc = await cursor.discover('.');
    
    expect(desc.status).toBe('UNSUPPORTED');
    expect(desc.available).toBe(false);
  });

  test('Should return detailed diagnostic object in CursorProvider', async () => {
    const cursor = IDEAgentRegistry.createAgent('cursor', { provider: 'cursor', model: 'test' })!;
    const diag = await cursor.diagnose('.');
    
    expect(diag.providerId).toBe('cursor');
    expect(diag.installed).toBe(false);
    expect(diag.blockers.length).toBeGreaterThan(0);
    expect(diag.blockers[0].code).toBe('INTEGRATION_UNSUPPORTED');
  });

  test('Should report NOT_CONFIGURED for AntigravityProvider if workspaceId is missing', async () => {
    const oldProj = process.env.ANTIGRAVITY_PROJECT_ID;
    const oldWork = process.env.ANTIGRAVITY_WORKSPACE_ID;
    delete process.env.ANTIGRAVITY_PROJECT_ID;
    delete process.env.ANTIGRAVITY_WORKSPACE_ID;

    const anti = IDEAgentRegistry.createAgent('antigravity', { provider: 'antigravity', model: 'test' })!;
    const desc = await anti.discover('.');
    
    expect(desc.status).toBe('NOT_CONFIGURED');
    expect(desc.available).toBe(false);

    if (oldProj) process.env.ANTIGRAVITY_PROJECT_ID = oldProj;
    if (oldWork) process.env.ANTIGRAVITY_WORKSPACE_ID = oldWork;
  });

  test('Should report WORKSPACE_ID_REQUIRED blocker in Antigravity diagnose when not configured', async () => {
    const oldProj = process.env.ANTIGRAVITY_PROJECT_ID;
    const oldWork = process.env.ANTIGRAVITY_WORKSPACE_ID;
    delete process.env.ANTIGRAVITY_PROJECT_ID;
    delete process.env.ANTIGRAVITY_WORKSPACE_ID;

    const anti = IDEAgentRegistry.createAgent('antigravity', { provider: 'antigravity', model: 'test' })!;
    const diag = await anti.diagnose('.');
    
    expect(diag.status).toBe('NOT_CONFIGURED');
    expect(diag.blockers.some(b => b.code === 'WORKSPACE_ID_REQUIRED')).toBe(true);
    expect(diag.manualActions.length).toBeGreaterThan(0);

    if (oldProj) process.env.ANTIGRAVITY_PROJECT_ID = oldProj;
    if (oldWork) process.env.ANTIGRAVITY_WORKSPACE_ID = oldWork;
  });

  test('Should select fallback in AUTO mode if IDE agent is NOT_CONFIGURED', async () => {
    const config: LLMConfig = {
      provider: 'auto',
      model: 'test-model',
      strategy: {
        preferred: ['cursor', 'mock'],
        fallback: ['mock']
      }
    };
    const router = new LLMProviderRouter(config);
    const resolved = await router.resolveProvider();
    
    expect(resolved.getConfig().provider).toBe('mock');
  });

  test('Should throw error in STRICT mode if preferred provider is unavailable', async () => {
    const config: LLMConfig = {
      provider: 'cursor',
      model: 'test-model',
      mode: 'strict'
    };
    const router = new LLMProviderRouter(config);
    await expect(router.resolveProvider()).rejects.toThrow();
  });

  test('Should allow custom configured Cursor agent to become AVAILABLE in tests', async () => {
    const cursor = IDEAgentRegistry.createAgent('cursor', { provider: 'cursor', model: 'test' })!;
    await cursor.configure({
      customParams: { mockOnline: 'true' }
    });
    
    const desc = await cursor.discover('.');
    expect(desc.status).toBe('AVAILABLE');
    expect(desc.available).toBe(true);
  });
});
