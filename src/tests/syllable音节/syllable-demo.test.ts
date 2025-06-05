/**
 * syllable-demo.test.ts
 * 运行 syllable 库演示的测试文件
 */

import {
  demonstrateBasicSyllableCounting,
  demonstrateSyllableBreaking,
  demonstrateBatchProcessing,
  demonstrateSpecialCases,
  demonstratePerformance,
  demonstrateRealWorldUsage,
  runAllDemonstrations
} from './syllable-demo';

describe('Syllable 库演示测试', () => {
  test('基础音节计数演示应该正常运行', () => {
    expect(() => demonstrateBasicSyllableCounting()).not.toThrow();
  });

  test('音节分割演示应该正常运行', () => {
    expect(() => demonstrateSyllableBreaking()).not.toThrow();
  });

  test('批量处理演示应该正常运行', () => {
    expect(() => demonstrateBatchProcessing()).not.toThrow();
  });

  test('特殊情况演示应该正常运行', () => {
    expect(() => demonstrateSpecialCases()).not.toThrow();
  });

  test('性能测试演示应该正常运行', () => {
    expect(() => demonstratePerformance()).not.toThrow();
  });

  test('实际应用场景演示应该正常运行', () => {
    expect(() => demonstrateRealWorldUsage()).not.toThrow();
  });

  test('完整演示应该正常运行', () => {
    expect(() => runAllDemonstrations()).not.toThrow();
  });
});
