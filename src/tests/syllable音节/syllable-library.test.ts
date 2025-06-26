/**
 * syllable-library.test.ts
 * 测试 syllable 库的音节生成功能
 * 验证库是否能正确计算英语单词的音节数量
 */

import { syllable } from 'syllable';
import { advancedSyllabify, batchSyllabify, getSyllableCount } from '../../utils/text/syllable';

describe('Syllable 库功能测试', () => {

  describe('基础音节计数测试', () => {
    test('单音节单词应该返回 1', () => {
      const singleSyllableWords = ['cat', 'dog', 'run', 'big', 'red', 'sun', 'book', 'tree'];

      singleSyllableWords.forEach(word => {
        const count = syllable(word);
        expect(count).toBe(1);
        console.log(`✅ "${word}" -> ${count} 音节`);
      });
    });

    test('双音节单词应该返回 2', () => {
      const doubleSyllableWords = ['happy', 'water', 'table', 'window', 'garden', 'simple', 'paper', 'tiger'];

      doubleSyllableWords.forEach(word => {
        const count = syllable(word);
        expect(count).toBe(2);
        console.log(`✅ "${word}" -> ${count} 音节`);
      });
    });

    test('三音节单词应该返回 3', () => {
      const tripleSyllableWords = ['beautiful', 'computer', 'elephant', 'banana', 'important', 'wonderful'];

      tripleSyllableWords.forEach(word => {
        const count = syllable(word);
        expect(count).toBe(3);
        console.log(`✅ "${word}" -> ${count} 音节`);
      });
    });

    test('多音节单词测试', () => {
      const multiSyllableWords = [
        { word: 'university', expected: 5 },
        { word: 'information', expected: 4 },
        { word: 'development', expected: 4 },
        { word: 'organization', expected: 5 },
        { word: 'international', expected: 5 },
        { word: 'communication', expected: 5 }
      ];

      multiSyllableWords.forEach(({ word, expected }) => {
        const count = syllable(word);
        expect(count).toBe(expected);
        console.log(`✅ "${word}" -> ${count} 音节 (期望: ${expected})`);
      });
    });
  });

  describe('特殊情况测试', () => {
    test('空字符串和无效输入', () => {
      expect(syllable('')).toBe(0);
      expect(syllable(' ')).toBe(0);
      console.log('✅ 空字符串处理正确');
    });

    test('单字母单词', () => {
      const singleLetters = ['a', 'I', 'o'];
      singleLetters.forEach(letter => {
        const count = syllable(letter);
        expect(count).toBeGreaterThanOrEqual(1);
        console.log(`✅ "${letter}" -> ${count} 音节`);
      });
    });

    test('包含静音 e 的单词', () => {
      const silentEWords = [
        { word: 'make', expected: 1 },
        { word: 'take', expected: 1 },
        { word: 'home', expected: 1 },
        { word: 'time', expected: 1 },
        { word: 'place', expected: 1 }
      ];

      silentEWords.forEach(({ word, expected }) => {
        const count = syllable(word);
        expect(count).toBe(expected);
        console.log(`✅ "${word}" (静音e) -> ${count} 音节`);
      });
    });

    test('复合词测试', () => {
      const compoundWords = [
        { word: 'basketball', expected: 3 },
        { word: 'playground', expected: 2 },
        { word: 'sunshine', expected: 2 },
        { word: 'newspaper', expected: 3 },
        { word: 'classroom', expected: 2 }
      ];

      compoundWords.forEach(({ word, expected }) => {
        const count = syllable(word);
        expect(count).toBe(expected);
        console.log(`✅ "${word}" (复合词) -> ${count} 音节`);
      });
    });
  });

  describe('技术词汇测试', () => {
    test('编程相关词汇', () => {
      const programmingWords = [
        { word: 'function', expected: 2 },
        { word: 'variable', expected: 4 },
        { word: 'algorithm', expected: 4 },
        { word: 'programming', expected: 3 },
        { word: 'development', expected: 4 },
        { word: 'application', expected: 4 },
        { word: 'database', expected: 3 },
        { word: 'interface', expected: 3 }
      ];

      programmingWords.forEach(({ word, expected }) => {
        const count = syllable(word);
        console.log(`📊 "${word}" -> ${count} 音节 (期望: ${expected})`);
        // 对于技术词汇，我们允许一定的误差范围
        expect(Math.abs(count - expected)).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('项目自定义音节工具测试', () => {
    test('getSyllableCount 函数应该正常工作', () => {
      const testWords = ['hello', 'world', 'javascript', 'typescript'];

      testWords.forEach(word => {
        const count = getSyllableCount(word);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
        console.log(`✅ getSyllableCount("${word}") -> ${count}`);
      });
    });

    test('advancedSyllabify 函数应该返回音节数组', () => {
      const testWords = ['hello', 'beautiful', 'computer', 'development'];

      testWords.forEach(word => {
        const syllables = advancedSyllabify(word);
        expect(Array.isArray(syllables)).toBe(true);
        expect(syllables.length).toBeGreaterThan(0);
        expect(syllables.join('')).toBe(word);
        console.log(`✅ advancedSyllabify("${word}") -> [${syllables.join(', ')}]`);
      });
    });

    test('batchSyllabify 函数应该批量处理单词', () => {
      const testWords = ['cat', 'happy', 'beautiful', 'development'];
      const result = batchSyllabify(testWords);

      expect(typeof result).toBe('object');
      testWords.forEach(word => {
        expect(result[word]).toBeDefined();
        expect(Array.isArray(result[word])).toBe(true);
        console.log(`✅ batchSyllabify["${word}"] -> [${result[word].join(', ')}]`);
      });
    });
  });

  describe('性能测试', () => {
    test('大量单词处理性能', () => {
      const words = [
        'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
        'hello', 'world', 'javascript', 'typescript', 'programming', 'development',
        'beautiful', 'wonderful', 'amazing', 'incredible', 'fantastic', 'excellent'
      ];

      const startTime = performance.now();

      words.forEach(word => {
        syllable(word);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`✅ 处理 ${words.length} 个单词耗时: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('边界情况测试', () => {
    test('大写字母单词', () => {
      const upperCaseWords = ['HELLO', 'WORLD', 'JAVASCRIPT'];

      upperCaseWords.forEach(word => {
        const count = syllable(word);
        const lowerCount = syllable(word.toLowerCase());
        expect(count).toBe(lowerCount);
        console.log(`✅ "${word}" -> ${count} 音节 (与小写一致)`);
      });
    });

    test('混合大小写单词', () => {
      const mixedCaseWords = ['JavaScript', 'TypeScript', 'GitHub', 'iPhone'];

      mixedCaseWords.forEach(word => {
        const count = syllable(word);
        expect(count).toBeGreaterThan(0);
        console.log(`✅ "${word}" -> ${count} 音节`);
      });
    });

    test('包含数字的单词', () => {
      const wordsWithNumbers = ['web3', 'html5', 'css3', 'es6'];

      wordsWithNumbers.forEach(word => {
        const count = syllable(word);
        expect(count).toBeGreaterThan(0);
        console.log(`✅ "${word}" -> ${count} 音节`);
      });
    });
  });
});
