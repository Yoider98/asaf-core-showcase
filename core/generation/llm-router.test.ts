import { LLMProviderRouter } from './llm-router';
import { LLMConfig } from './types';
import './providers/mock-provider';

describe('LLMProviderRouter Tests', () => {
  test('Should resolve configured single provider', async () => {
    const config: LLMConfig = {
      provider: 'mock',
      model: 'test-model'
    };
    const router = new LLMProviderRouter(config);
    const provider = await router.resolveProvider();
    expect(provider.getConfig().provider).toBe('mock');
  });

  test('Should select fallback provider if preferred is unavailable', async () => {
    const config: LLMConfig = {
      provider: 'auto',
      model: 'test-model',
      strategy: {
        preferred: ['unavailable-provider', 'mock'],
        fallback: ['mock']
      }
    };
    const router = new LLMProviderRouter(config);
    const provider = await router.resolveProvider();
    expect(provider.getConfig().provider).toBe('mock');
  });
});
