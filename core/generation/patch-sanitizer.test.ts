import { LogicalPatchSanitizer, PhysicalSafetyValidator } from './patch-sanitizer';
import { FilePatch } from '../execution/types';
import { ChangePlan } from '../reasoning/types';
import { ProjectModel } from '../domain/project-model';
import { LLMGenerationError } from './types';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

describe('LogicalPatchSanitizer Tests (In Memory)', () => {
  // Configuración del ChangePlan Mock
  const changePlan: ChangePlan = {
    task: 'Test task',
    intent: {
      task: 'Test task',
      action: 'REFACTOR',
      concepts: [],
      technicalAreas: [],
      probableArtifacts: [],
      confidence: 1.0
    },
    targets: ['src/auth/service.ts'],
    summary: { changeType: 'REFACTOR', complexity: 'LOW', riskScore: 10 },
    changes: [
      {
        path: 'src/auth/service.ts',
        action: 'MODIFY',
        priority: 1,
        reason: 'modify file',
        dependencies: [],
        evidence: []
      },
      {
        path: 'src/auth/service.test.ts',
        action: 'CREATE',
        priority: 2,
        reason: 'new test file',
        dependencies: [],
        evidence: []
      },
      {
        path: 'src/auth/obsolete.ts',
        action: 'DELETE',
        priority: 3,
        reason: 'delete file',
        dependencies: [],
        evidence: []
      },
      {
        path: 'package.json',
        action: 'MODIFY',
        priority: 4,
        reason: 'edit dependencies',
        dependencies: [],
        evidence: []
      }
    ],
    impact: { affectedNodes: [], dependencies: [], dependents: [], boundariesCrossed: [] },
    tests: { affected: [], recommended: [], missing: [] },
    risks: [],
    architecture: { violations: [], affectedADRs: [], conflicts: [] },
    evidence: [],
    recommendations: []
  };

  // Configuración del ProjectModel Mock
  const originalModel: ProjectModel = {
    project: { name: 'ASAF', version: '0.1.0', path: '.' },
    indexMetadata: { schemaVersion: 1, indexerVersion: '1.0', createdAt: '', updatedAt: '', diagnostics: [] },
    files: [
      {
        path: 'src/auth/service.ts',
        hash: 'abc123original',
        size: 1000 // 1000 bytes
      },
      {
        path: 'package.json',
        hash: 'pkgjsonoriginal',
        size: 400
      }
    ],
    modules: [],
    symbols: [
      { id: '1', name: 'AuthService', type: 'class', filePath: 'src/auth/service.ts', line: 10 },
      { id: '2', name: 'login', type: 'function', filePath: 'src/auth/service.ts', line: 20 },
      { id: '3', name: 'logout', type: 'function', filePath: 'src/auth/service.ts', line: 30 }
    ],
    relations: [],
    apis: [],
    databases: [],
    tests: [],
    dependencies: [],
    architecture: { layers: [] },
    decisions: [],
    git: { indexedCommit: '', headCommit: '', isDirty: false, changedFilesSinceLastIndex: [], indexTimestamp: '' }
  };

  describe('Path Normalization & Multiplatform Blocking', () => {
    test('Should normalize mixed separators', () => {
      const p = LogicalPatchSanitizer.normalizePath('src\\auth/service.ts');
      expect(p).toBe('src/auth/service.ts');
    });

    test('Should reject Windows drive paths (Absolute)', () => {
      expect(() => LogicalPatchSanitizer.normalizePath('C:\\evil.ts')).toThrow(LLMGenerationError);
      expect(() => LogicalPatchSanitizer.normalizePath('d:/evil.ts')).toThrow(LLMGenerationError);
    });

    test('Should reject Windows drive-relative paths', () => {
      expect(() => LogicalPatchSanitizer.normalizePath('C:evil.ts')).toThrow(LLMGenerationError);
      expect(() => LogicalPatchSanitizer.normalizePath('c:evil.ts')).toThrow(LLMGenerationError);
    });

    test('Should reject absolute POSIX paths', () => {
      expect(() => LogicalPatchSanitizer.normalizePath('/etc/passwd')).toThrow(LLMGenerationError);
    });

    test('Should reject UNC paths', () => {
      expect(() => LogicalPatchSanitizer.normalizePath('\\\\server\\share\\evil.ts')).toThrow(LLMGenerationError);
      expect(() => LogicalPatchSanitizer.normalizePath('//server/share/evil.ts')).toThrow(LLMGenerationError);
    });

    test('Should reject path traversal escaping workspace', () => {
      expect(() => LogicalPatchSanitizer.normalizePath('../../evil.ts')).toThrow(LLMGenerationError);
      expect(() => LogicalPatchSanitizer.normalizePath('src/auth/../../../evil.ts')).toThrow(LLMGenerationError);
    });

    test('Should resolve path traversal inside workspace', () => {
      const p = LogicalPatchSanitizer.normalizePath('src/auth/../auth/service.ts');
      expect(p).toBe('src/auth/service.ts');
    });

    test('Should reject Unicode traversal representations', () => {
      // Intentar escapar del workspace usando Unicode/Codificado
      expect(() => LogicalPatchSanitizer.normalizePath('src/%2e%2e/%2e%2e/evil.ts')).toThrow(LLMGenerationError);
      expect(() => LogicalPatchSanitizer.normalizePath('src/．．/．．/evil.ts')).toThrow(LLMGenerationError);
      // Traversal seguro dentro del workspace
      expect(LogicalPatchSanitizer.normalizePath('src/%2e%2e/evil.ts')).toBe('evil.ts');
    });
  });

  describe('File policy enforcement', () => {
    test('Should reject ALWAYS_DENY paths (like .asaf and .git)', () => {
      const patches: FilePatch[] = [
        { filePath: '.asaf/proposals/prop_1.json', action: 'MODIFY', expectedHashBefore: null, content: '{}' }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain('Modification of reserved file is forbidden');
    });

    test('Should reject ALWAYS_DENY lock files', () => {
      const patches: FilePatch[] = [
        { filePath: 'package-lock.json', action: 'MODIFY', expectedHashBefore: null, content: '{}' }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain('Modification of reserved file is forbidden');
    });

    test('Should reject DENY_UNLESS_EXPLICITLY_AUTHORIZED configurations if not in ChangePlan', () => {
      const patches: FilePatch[] = [
        { filePath: 'tsconfig.json', action: 'MODIFY', expectedHashBefore: null, content: '{}' }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain('Unauthorized modification of configuration file');
    });

    test('Should allow DENY_UNLESS_EXPLICITLY_AUTHORIZED configurations if listed in ChangePlan', () => {
      const patches: FilePatch[] = [
        { filePath: 'package.json', action: 'MODIFY', expectedHashBefore: null, content: '{}' }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(true);
    });
  });

  describe('Scope & Allowed actions', () => {
    test('Should reject files not listed in ChangePlan scope', () => {
      const patches: FilePatch[] = [
        { filePath: 'src/auth/service.ts', action: 'MODIFY', expectedHashBefore: null, content: 'code' },
        { filePath: 'src/controllers/user.ts', action: 'MODIFY', expectedHashBefore: null, content: 'code' }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain('File modification is outside of the approved ChangePlan scope');
    });

    test('Should reject unauthorized actions (e.g. DELETE on MODIFY change item)', () => {
      const patches: FilePatch[] = [
        { filePath: 'src/auth/service.ts', action: 'DELETE', expectedHashBefore: null }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain("Action 'DELETE' is not authorized");
    });

    test('Should reject actions on REVIEW ChangeItem', () => {
      // Mock un item con REVIEW
      const planWithReview: ChangePlan = {
        ...changePlan,
        changes: [
          { path: 'src/auth/service.ts', action: 'REVIEW', priority: 1, reason: '', dependencies: [], evidence: [] }
        ]
      };

      const patches: FilePatch[] = [
        { filePath: 'src/auth/service.ts', action: 'MODIFY', expectedHashBefore: null, content: 'code' }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, planWithReview, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain("Action 'MODIFY' is not authorized");
    });
  });

  describe('Duplicates & Truncation checks', () => {
    test('Should reject duplicate operations on same file', () => {
      const patches: FilePatch[] = [
        { filePath: 'src/auth/service.ts', action: 'MODIFY', expectedHashBefore: null, content: 'a' },
        { filePath: 'src/auth/service.ts', action: 'MODIFY', expectedHashBefore: null, content: 'b' }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain('Duplicate operation on file');
    });

    test('Should reject code with ellipsis comments (Truncation)', () => {
      const patches: FilePatch[] = [
        {
          filePath: 'src/auth/service.ts',
          action: 'MODIFY',
          expectedHashBefore: null,
          content: `
            const a = 12;
            // ... rest of the code remains the same
          `
        }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(false);
      expect(res.errors[0]).toContain('Truncation Violation: Truncated elipsis');
    });

    test('Should emit warning for structural code reduction', () => {
      const patches: FilePatch[] = [
        {
          filePath: 'src/auth/service.ts',
          action: 'MODIFY',
          expectedHashBefore: null,
          content: 'short' // Original size is 1000. 5 bytes < 300 bytes.
        }
      ];

      const res = LogicalPatchSanitizer.sanitize(patches, changePlan, originalModel);
      expect(res.passed).toBe(true); // Warnings do not fail validation
      expect(res.warnings).toHaveLength(2); // suspicious reduction + symbol loss
      expect(res.warnings[0].category).toBe('SUSPICIOUS_REDUCTION');
      expect(res.warnings[1].category).toBe('SYMBOL_LOSS');
    });
  });
});

describe('PhysicalSafetyValidator Tests (Mocked filesystem)', () => {
  let mockFs: any;

  beforeEach(() => {
    mockFs = {
      realpathSync: jest.fn().mockImplementation((p: string) => path.resolve(p)),
      lstatSync: jest.fn(),
      readFileSync: jest.fn()
    };
  });

  test('Should validate path containment and check symlinks and directory blocks', () => {
    mockFs.lstatSync.mockReturnValue({
      isSymbolicLink: () => true,
      isDirectory: () => false
    });

    const validator = new PhysicalSafetyValidator('.', mockFs);

    const patches: FilePatch[] = [
      { filePath: 'src/auth/service.ts', action: 'MODIFY', expectedHashBefore: null, content: 'code' }
    ];

    expect(() => validator.validateAndResolveHashes(patches)).toThrow(
      'Security Violation: Symlink blocked'
    );
  });

  test('Should reject directory operations', () => {
    mockFs.lstatSync.mockReturnValue({
      isSymbolicLink: () => false,
      isDirectory: () => true
    });

    const validator = new PhysicalSafetyValidator('.', mockFs);

    const patches: FilePatch[] = [
      { filePath: 'src/auth/service.ts', action: 'MODIFY', expectedHashBefore: null, content: 'code' }
    ];

    expect(() => validator.validateAndResolveHashes(patches)).toThrow(
      'Security Violation: Target \'src/auth/service.ts\' is a directory.'
    );
  });

  test('Should resolve expectedHashBefore dynamically for existing files', () => {
    mockFs.lstatSync.mockReturnValue({
      isSymbolicLink: () => false,
      isDirectory: () => false
    });
    mockFs.readFileSync.mockReturnValue('physical disk file content');

    const validator = new PhysicalSafetyValidator('.', mockFs);

    const patches: FilePatch[] = [
      { filePath: 'src/auth/service.ts', action: 'MODIFY', expectedHashBefore: null, content: 'code' }
    ];

    validator.validateAndResolveHashes(patches);

    const expectedHash = crypto.createHash('sha256').update('physical disk file content').digest('hex');
    expect(patches[0].expectedHashBefore).toBe(expectedHash);
  });

  test('Should set expectedHashBefore to null on CREATE', () => {
    mockFs.lstatSync.mockImplementation(() => {
      const err = new Error('File not found') as any;
      err.code = 'ENOENT';
      throw err;
    });

    const validator = new PhysicalSafetyValidator('.', mockFs);

    const patches: FilePatch[] = [
      { filePath: 'src/auth/service.test.ts', action: 'CREATE', expectedHashBefore: null, content: 'code' }
    ];

    validator.validateAndResolveHashes(patches);
    expect(patches[0].expectedHashBefore).toBeNull();
  });
});
