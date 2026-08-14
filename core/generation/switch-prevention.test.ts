import { LLMProviderRouter } from './llm-router';
import { LLMConfig } from './types';
import './providers/mock-provider';

describe('Hot switching prevention in LLMProviderRouter', () => {
  test('Should return the same active provider instance once resolved', async () => {
    const config: LLMConfig = {
      provider: 'auto',
      model: 'test-model',
      strategy: {
        preferred: ['mock'],
        fallback: ['mock']
      }
    };
    const router = new LLMProviderRouter(config);
    const firstInstance = await router.resolveProvider();
    const secondInstance = await router.resolveProvider();

    expect(firstInstance).toBe(secondInstance);
  });
});
