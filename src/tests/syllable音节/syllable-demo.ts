/**
 * syllable-demo.ts
 * Syllable 库使用演示
 * 展示如何在实际项目中使用音节分割功能
 */

import { syllable } from 'syllable';
import { advancedSyllabify, getSyllableCount, batchSyllabify } from '@utils/text/syllableUtils';

/**
 * 演示基础音节计数功能
 */
export function demonstrateBasicSyllableCounting() {
  console.log('🎯 基础音节计数演示');
  console.log('='.repeat(50));

  const words = [
    'cat', 'happy', 'beautiful', 'university', 'communication',
    'JavaScript', 'development', 'algorithm', 'interface'
  ];

  words.forEach(word => {
    const count = syllable(word);
    console.log(`📊 "${word}" → ${count} 音节`);
  });

  console.log('\n');
}

/**
 * 演示音节分割功能
 */
export function demonstrateSyllableBreaking() {
  console.log('✂️ 音节分割演示');
  console.log('='.repeat(50));

  const words = [
    'hello', 'beautiful', 'computer', 'development',
    'programming', 'application', 'international', 'communication'
  ];

  words.forEach(word => {
    const syllables = advancedSyllabify(word);
    const syllableCount = getSyllableCount(word);
    console.log(`🔤 "${word}" → [${syllables.join(' • ')}] (${syllableCount} 音节)`);
  });

  console.log('\n');
}

/**
 * 演示批量处理功能
 */
export function demonstrateBatchProcessing() {
  console.log('📦 批量处理演示');
  console.log('='.repeat(50));

  const wordList = [
    'function', 'variable', 'algorithm', 'database',
    'interface', 'application', 'development', 'programming'
  ];

  const results = batchSyllabify(wordList);

  Object.entries(results).forEach(([word, syllables]) => {
    console.log(`🎯 "${word}" → [${syllables.join(' • ')}]`);
  });

  console.log('\n');
}

/**
 * 演示特殊情况处理
 */
export function demonstrateSpecialCases() {
  console.log('🔍 特殊情况演示');
  console.log('='.repeat(50));

  const specialWords = [
    'I', 'a', 'make', 'time', 'place',  // 单字母和静音e
    'JavaScript', 'TypeScript', 'GitHub',  // 混合大小写
    'web3', 'html5', 'css3',  // 包含数字
    'basketball', 'playground', 'sunshine'  // 复合词
  ];

  specialWords.forEach(word => {
    const count = syllable(word);
    const syllables = advancedSyllabify(word);
    console.log(`🎪 "${word}" → ${count} 音节 [${syllables.join(' • ')}]`);
  });

  console.log('\n');
}

/**
 * 演示性能测试
 */
export function demonstratePerformance() {
  console.log('⚡ 性能测试演示');
  console.log('='.repeat(50));

  const testWords = [
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'hello', 'world', 'javascript', 'typescript', 'programming', 'development',
    'beautiful', 'wonderful', 'amazing', 'incredible', 'fantastic', 'excellent',
    'university', 'information', 'communication', 'international', 'organization'
  ];

  // 测试基础音节计数性能
  const startTime1 = performance.now();
  testWords.forEach(word => syllable(word));
  const endTime1 = performance.now();

  // 测试音节分割性能
  const startTime2 = performance.now();
  testWords.forEach(word => advancedSyllabify(word));
  const endTime2 = performance.now();

  // 测试批量处理性能
  const startTime3 = performance.now();
  batchSyllabify(testWords);
  const endTime3 = performance.now();

  console.log(`📊 基础计数 (${testWords.length} 词): ${(endTime1 - startTime1).toFixed(2)}ms`);
  console.log(`📊 音节分割 (${testWords.length} 词): ${(endTime2 - startTime2).toFixed(2)}ms`);
  console.log(`📊 批量处理 (${testWords.length} 词): ${(endTime3 - startTime3).toFixed(2)}ms`);

  console.log('\n');
}

/**
 * 演示实际应用场景
 */
export function demonstrateRealWorldUsage() {
  console.log('🌍 实际应用场景演示');
  console.log('='.repeat(50));

  // 场景1: 文本阅读辅助
  const sentence = "The beautiful butterfly landed on the colorful flower.";
  const words = sentence.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

  console.log('📖 文本阅读辅助:');
  console.log(`原句: "${sentence}"`);
  console.log('音节分析:');

  words.forEach(word => {
    if (word.length > 0) {
      const syllables = advancedSyllabify(word);
      const count = getSyllableCount(word);
      console.log(`   "${word}" → [${syllables.join('•')}] (${count}音节)`);
    }
  });

  // 场景2: 单词难度评估
  console.log('\n📚 单词难度评估:');
  const vocabularyWords = [
    'cat', 'happy', 'beautiful', 'magnificent', 'extraordinary'
  ];

  vocabularyWords.forEach(word => {
    const count = getSyllableCount(word);
    let difficulty = '';
    if (count === 1) difficulty = '简单';
    else if (count === 2) difficulty = '中等';
    else if (count === 3) difficulty = '较难';
    else difficulty = '困难';

    console.log(`   "${word}" → ${count}音节 (${difficulty})`);
  });

  console.log('\n');
}

/**
 * 运行所有演示
 */
export function runAllDemonstrations() {
  console.log('🎭 Syllable 库完整演示');
  console.log('='.repeat(60));
  console.log('');

  demonstrateBasicSyllableCounting();
  demonstrateSyllableBreaking();
  demonstrateBatchProcessing();
  demonstrateSpecialCases();
  demonstratePerformance();
  demonstrateRealWorldUsage();

  console.log('✅ 演示完成！Syllable 库工作正常，可以在项目中安全使用。');
}

// 如果直接运行此文件，执行演示
if (typeof require !== 'undefined' && require.main === module) {
  runAllDemonstrations();
}
