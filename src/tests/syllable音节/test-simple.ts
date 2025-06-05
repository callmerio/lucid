import { syllable } from 'syllable';

console.log('🎯 测试开始');

const words = ['cat', 'hello', 'beautiful'];

words.forEach(word => {
  const count = syllable(word);
  console.log(`"${word}" → ${count} 音节`);
});

console.log('✅ 测试完成');
