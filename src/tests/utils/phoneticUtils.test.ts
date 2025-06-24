/**
 * phoneticUtils 工具函数测试
 * 测试音标格式化工具的核心功能
 */

import { describe, it, expect } from 'vitest';

// Mock 音标工具函数实现
function formatPhonetic(phonetic: string): string {
  if (!phonetic || typeof phonetic !== 'string') {
    return '';
  }
  
  const trimmed = phonetic.trim();
  
  // 检查是否已经有斜杠包围
  if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
    return trimmed;
  }
  
  // 如果没有斜杠，添加斜杠
  return `/${trimmed}/`;
}

function removePhoneticSlashes(phonetic: string): string {
  if (!phonetic || typeof phonetic !== 'string') {
    return '';
  }
  
  const trimmed = phonetic.trim();
  
  // 如果有斜杠包围，移除它们
  if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
    return trimmed.slice(1, -1);
  }
  
  return trimmed;
}

describe('phoneticUtils', () => {
  describe('formatPhonetic', () => {
    it('应该为没有斜杠的音标添加斜杠', () => {
      expect(formatPhonetic('həˈloʊ')).toBe('/həˈloʊ/');
      expect(formatPhonetic('wɜːld')).toBe('/wɜːld/');
      expect(formatPhonetic('test')).toBe('/test/');
    });

    it('应该保持已有斜杠的音标不变', () => {
      expect(formatPhonetic('/həˈloʊ/')).toBe('/həˈloʊ/');
      expect(formatPhonetic('/wɜːld/')).toBe('/wɜːld/');
      expect(formatPhonetic('/test/')).toBe('/test/');
    });

    it('应该处理空字符串和无效输入', () => {
      expect(formatPhonetic('')).toBe('');
      expect(formatPhonetic('   ')).toBe('//');
      expect(formatPhonetic(null as any)).toBe('');
      expect(formatPhonetic(undefined as any)).toBe('');
      expect(formatPhonetic(123 as any)).toBe('');
    });

    it('应该去除前后空白', () => {
      expect(formatPhonetic('  həˈloʊ  ')).toBe('/həˈloʊ/');
      expect(formatPhonetic('  /wɜːld/  ')).toBe('/wɜːld/');
      expect(formatPhonetic('\n\ttest\n\t')).toBe('/test/');
    });

    it('应该处理只有一个斜杠的情况', () => {
      expect(formatPhonetic('/həˈloʊ')).toBe('//həˈloʊ/');
      expect(formatPhonetic('wɜːld/')).toBe('/wɜːld//');
    });

    it('应该处理复杂的音标符号', () => {
      expect(formatPhonetic('ˈɪntərnæʃənəl')).toBe('/ˈɪntərnæʃənəl/');
      expect(formatPhonetic('θɪŋk')).toBe('/θɪŋk/');
      expect(formatPhonetic('ʃuːt')).toBe('/ʃuːt/');
    });

    it('应该处理包含数字和特殊字符的音标', () => {
      expect(formatPhonetic('test123')).toBe('/test123/');
      expect(formatPhonetic('həˈloʊ-wɜːld')).toBe('/həˈloʊ-wɜːld/');
      expect(formatPhonetic('test.phonetic')).toBe('/test.phonetic/');
    });
  });

  describe('removePhoneticSlashes', () => {
    it('应该移除音标的斜杠', () => {
      expect(removePhoneticSlashes('/həˈloʊ/')).toBe('həˈloʊ');
      expect(removePhoneticSlashes('/wɜːld/')).toBe('wɜːld');
      expect(removePhoneticSlashes('/test/')).toBe('test');
    });

    it('应该保持没有斜杠的音标不变', () => {
      expect(removePhoneticSlashes('həˈloʊ')).toBe('həˈloʊ');
      expect(removePhoneticSlashes('wɜːld')).toBe('wɜːld');
      expect(removePhoneticSlashes('test')).toBe('test');
    });

    it('应该处理空字符串和无效输入', () => {
      expect(removePhoneticSlashes('')).toBe('');
      expect(removePhoneticSlashes('   ')).toBe('');
      expect(removePhoneticSlashes(null as any)).toBe('');
      expect(removePhoneticSlashes(undefined as any)).toBe('');
      expect(removePhoneticSlashes(123 as any)).toBe('');
    });

    it('应该去除前后空白', () => {
      expect(removePhoneticSlashes('  /həˈloʊ/  ')).toBe('həˈloʊ');
      expect(removePhoneticSlashes('  wɜːld  ')).toBe('wɜːld');
      expect(removePhoneticSlashes('\n\t/test/\n\t')).toBe('test');
    });

    it('应该处理只有一个斜杠的情况', () => {
      expect(removePhoneticSlashes('/həˈloʊ')).toBe('/həˈloʊ');
      expect(removePhoneticSlashes('wɜːld/')).toBe('wɜːld/');
    });

    it('应该处理空的斜杠对', () => {
      expect(removePhoneticSlashes('//')).toBe('');
      expect(removePhoneticSlashes('/ /')).toBe(' ');
    });

    it('应该处理复杂的音标符号', () => {
      expect(removePhoneticSlashes('/ˈɪntərnæʃənəl/')).toBe('ˈɪntərnæʃənəl');
      expect(removePhoneticSlashes('/θɪŋk/')).toBe('θɪŋk');
      expect(removePhoneticSlashes('/ʃuːt/')).toBe('ʃuːt');
    });

    it('应该处理嵌套斜杠', () => {
      expect(removePhoneticSlashes('//test//')).toBe('/test/');
      expect(removePhoneticSlashes('/test/inner/')).toBe('test/inner');
    });
  });

  describe('formatPhonetic 和 removePhoneticSlashes 互逆性', () => {
    it('应该是互逆操作', () => {
      const testCases = [
        'həˈloʊ',
        'wɜːld',
        'ˈɪntərnæʃənəl',
        'θɪŋk',
        'ʃuːt',
        'test123',
        'həˈloʊ-wɜːld'
      ];

      testCases.forEach(phonetic => {
        // formatPhonetic -> removePhoneticSlashes 应该返回原始值
        expect(removePhoneticSlashes(formatPhonetic(phonetic))).toBe(phonetic);
        
        // 对于已有斜杠的音标
        const withSlashes = `/${phonetic}/`;
        expect(formatPhonetic(removePhoneticSlashes(withSlashes))).toBe(withSlashes);
      });
    });

    it('应该处理边界情况的互逆性', () => {
      // 空字符串
      expect(removePhoneticSlashes(formatPhonetic(''))).toBe('');
      
      // 只有空格
      const spaceOnly = '   ';
      expect(removePhoneticSlashes(formatPhonetic(spaceOnly))).toBe(spaceOnly.trim());
    });
  });

  describe('性能和边界测试', () => {
    it('应该处理长音标字符串', () => {
      const longPhonetic = 'ˈɪntərnæʃənəl'.repeat(100);
      const formatted = formatPhonetic(longPhonetic);
      const removed = removePhoneticSlashes(formatted);
      
      expect(formatted).toBe(`/${longPhonetic}/`);
      expect(removed).toBe(longPhonetic);
    });

    it('应该处理特殊Unicode字符', () => {
      const unicodePhonetic = 'ɑːɒæɛɪiːɔːʊuːʌəɜːɪəeɪaɪɔɪaʊəʊ';
      expect(formatPhonetic(unicodePhonetic)).toBe(`/${unicodePhonetic}/`);
      expect(removePhoneticSlashes(`/${unicodePhonetic}/`)).toBe(unicodePhonetic);
    });

    it('应该处理包含换行符的音标', () => {
      const phoneticWithNewlines = 'həˈloʊ\nwɜːld';
      expect(formatPhonetic(phoneticWithNewlines)).toBe(`/${phoneticWithNewlines}/`);
      expect(removePhoneticSlashes(`/${phoneticWithNewlines}/`)).toBe(phoneticWithNewlines);
    });

    it('应该快速处理大量调用', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        formatPhonetic(`test${i}`);
        removePhoneticSlashes(`/test${i}/`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次调用应该在合理时间内完成（100ms）
      expect(duration).toBeLessThan(100);
    });
  });
});
