import * as fs from 'fs';
import * as child_process from 'child_process';
import { GitSafetyLayer } from './git-safety';

jest.mock('child_process');
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn()
  };
});

describe('GitSafetyLayer Tests', () => {
  const projectPath = '/dummy/project';
  let gitSafety: GitSafetyLayer;

  beforeEach(() => {
    jest.resetAllMocks();
    gitSafety = new GitSafetyLayer(projectPath);
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  test('should return isRepository false if git command fails', () => {
    (child_process.execSync as jest.Mock).mockImplementation(() => {
      throw new Error('not a git repository');
    });

    const report = gitSafety.inspect();
    expect(report.isRepository).toBe(false);
  });

  test('should detect active merge/rebase based on git folder files', () => {
    // Es repositorio
    (child_process.execSync as jest.Mock).mockImplementation((cmd) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      return '';
    });

    // Simular que MERGE_HEAD existe
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath.endsWith('MERGE_HEAD');
    });

    const report = gitSafety.inspect();
    expect(report.isRepository).toBe(true);
    expect(report.activeMergeOrRebase).toBe(true);

    expect(() => {
      gitSafety.assertSafeForExecution({ requireCleanRepo: false });
    }).toThrow(/Git merge or rebase is active/);
  });

  test('should detect merge conflicts and block execution', () => {
    (child_process.execSync as jest.Mock).mockImplementation((cmd) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('status --porcelain')) {
        // UU indica conflicto de merge
        return 'UU src/conflict.ts\0';
      }
      return '';
    });

    const report = gitSafety.inspect();
    expect(report.conflictingFiles).toContain('src/conflict.ts');
    expect(report.isClean).toBe(false);

    expect(() => {
      gitSafety.assertSafeForExecution({ requireCleanRepo: false });
    }).toThrow(/Workspace has unresolved merge conflicts/);
  });

  test('should block dirty workspace when required by policy', () => {
    (child_process.execSync as jest.Mock).mockImplementation((cmd) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('status --porcelain')) {
        return ' M src/dirty.ts\0';
      }
      return '';
    });

    const report = gitSafety.inspect();
    expect(report.changedFiles).toContain('src/dirty.ts');
    expect(report.isClean).toBe(false);

    // Permitido si la política no lo requiere
    expect(() => {
      gitSafety.assertSafeForExecution({ requireCleanRepo: false });
    }).not.toThrow();

    // Bloqueado si la política lo exige
    expect(() => {
      gitSafety.assertSafeForExecution({ requireCleanRepo: true });
    }).toThrow(/Workspace is dirty/);
  });

  test('should allow execution on clean repo', () => {
    (child_process.execSync as jest.Mock).mockImplementation((cmd) => {
      if (cmd.includes('rev-parse --git-dir')) return '.git';
      if (cmd.includes('rev-parse --abbrev-ref HEAD')) return 'main';
      if (cmd.includes('rev-parse HEAD')) return 'abcdef123';
      if (cmd.includes('status --porcelain')) return '';
      return '';
    });

    const report = gitSafety.inspect();
    expect(report.isRepository).toBe(true);
    expect(report.isClean).toBe(true);
    expect(report.currentBranch).toBe('main');
    expect(report.headCommit).toBe('abcdef123');

    expect(() => {
      gitSafety.assertSafeForExecution({ requireCleanRepo: true });
    }).not.toThrow();
  });
});
