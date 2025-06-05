/**
 * test-syllable.js
 * 简单的 syllable 库测试脚本
 */

import { syllable } from 'syllable';

console.log('🎯 测试 syllable 库基础功能');
console.log('='.repeat(40));

const testWords = [
  'cat', 'dog', 'hello', 'world', 'beautiful', 
  'computer', 'development', 'javascript', 'programming'
];

testWords.forEach(word => {
  try {
    const count = syllable(word);
    console.log(`✅ "${word}" → ${count} 音节`);
  } catch (error) {
    console.error(`❌ "${word}" → 错误:`, error.message);
  }
});

console.log('\n🎉 测试完成！');
