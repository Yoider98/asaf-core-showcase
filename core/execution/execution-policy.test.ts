import { ExecutionPolicy } from './execution-policy';

describe('ExecutionPolicy Tests', () => {
  test('should return forceDryRun true for CRITICAL risk', () => {
    const config = ExecutionPolicy.getPolicyForRisk('CRITICAL');
    expect(config.forceDryRun).toBe(true);
    expect(config.requireCleanRepo).toBe(true);
    expect(config.requireManualApproval).toBe(true);
  });

  test('should return forceDryRun false for HIGH risk but require approval and tests', () => {
    const config = ExecutionPolicy.getPolicyForRisk('HIGH');
    expect(config.forceDryRun).toBe(false);
    expect(config.requireCleanRepo).toBe(true);
    expect(config.requireManualApproval).toBe(true);
    expect(config.runPreValidationTests).toBe(true);
    expect(config.runPostValidationTests).toBe(true);
  });

  test('should not require manual approval for MEDIUM risk', () => {
    const config = ExecutionPolicy.getPolicyForRisk('MEDIUM');
    expect(config.forceDryRun).toBe(false);
    expect(config.requireCleanRepo).toBe(true);
    expect(config.requireManualApproval).toBe(false);
    expect(config.runPostValidationTests).toBe(true);
  });

  test('should not require clean repo for LOW risk', () => {
    const config = ExecutionPolicy.getPolicyForRisk('LOW');
    expect(config.forceDryRun).toBe(false);
    expect(config.requireCleanRepo).toBe(false);
    expect(config.requireManualApproval).toBe(false);
  });
});
