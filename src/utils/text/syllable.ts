/**
 * syllable.ts
 * 专业的音节分割工具，使用 syllable 库
 */

import { syllable } from 'syllable';

// 定义特殊单词字典的类型
type SpecialCases = {
  [key: string]: string[];
};

// 定义音节分割函数的返回类型（保留用于类型检查）
// type SyllableResult = string[];

/**
 * 高级音节分割函数
 * 使用专业的音节分割库，结合自定义规则
 * @param word - 要分割的单词
 * @returns 音节数组
 */
export function advancedSyllabify(word: string): string[] {
    if (!word || typeof word !== 'string') {
        return [word || ''];
    }

    const cleanWord = word.toLowerCase().trim();
    
    // 特殊情况处理
    if (cleanWord.length <= 1) {
        return [word];
    }

    // 预定义的特殊单词字典（用于覆盖算法结果）
    const specialCases: SpecialCases = {
        'debug': ['de', 'bug'],
        'escalade': ['es', 'ca', 'lade'],
        'beautiful': ['beau', 'ti', 'ful'],
        'chocolate': ['choc', 'o', 'late'],
        'elephant': ['el', 'e', 'phant'],
        'comfortable': ['com', 'fort', 'a', 'ble'],
        'refrigerator': ['re', 'frig', 'er', 'a', 'tor'],
        'pronunciation': ['pro', 'nun', 'ci', 'a', 'tion'],
        'technology': ['tech', 'nol', 'o', 'gy'],
        'university': ['u', 'ni', 'ver', 'si', 'ty'],
        'information': ['in', 'for', 'ma', 'tion'],
        'development': ['de', 'vel', 'op', 'ment'],
        'javascript': ['ja', 'va', 'script'],
        'database': ['da', 'ta', 'base'],
        'keyboard': ['key', 'board'],
        'software': ['soft', 'ware'],
        'hardware': ['hard', 'ware'],
        'internet': ['in', 'ter', 'net'],
        'computer': ['com', 'pu', 'ter'],
        'monitor': ['mon', 'i', 'tor'],
        'network': ['net', 'work'],
        'website': ['web', 'site'],
        'password': ['pass', 'word'],
        'username': ['us', 'er', 'name'],
        'telephone': ['tel', 'e', 'phone'],
        'television': ['tel', 'e', 'vi', 'sion'],
        'restaurant': ['res', 'tau', 'rant'],
        'hospital': ['hos', 'pi', 'tal'],
        'library': ['li', 'brar', 'y'],
        'dictionary': ['dic', 'tion', 'ar', 'y'],
        'vocabulary': ['vo', 'cab', 'u', 'lar', 'y'],
        'algorithm': ['al', 'go', 'rithm'],
        'important': ['im', 'por', 'tant'],
        'education': ['ed', 'u', 'ca', 'tion'],
        'fantastic': ['fan', 'tas', 'tic'],
        'wonderful': ['won', 'der', 'ful'],
        'incredible': ['in', 'cred', 'i', 'ble'],
        'amazing': ['a', 'maz', 'ing'],
        'container': ['con', 'tain', 'er'],
        'character': ['char', 'ac', 'ter'],
        'separator': ['sep', 'a', 'ra', 'tor'],
        'initialize': ['i', 'ni', 'tial', 'ize'],
        'function': ['func', 'tion'],
        'variable': ['var', 'i', 'a', 'ble'],
        'element': ['el', 'e', 'ment'],
        'document': ['doc', 'u', 'ment'],
        'program': ['pro', 'gram'],
        'coding': ['cod', 'ing'],
        'printer': ['print', 'er'],
        'scanner': ['scan', 'ner'],
        'example': ['ex', 'am', 'ple'],
        'syllable': ['syl', 'la', 'ble'],
        'hyphenation': ['hy', 'phen', 'a', 'tion'],
        'animal': ['an', 'i', 'mal'],
        'banana': ['ba', 'na', 'na'],
        'museum': ['mu', 'se', 'um'],
        // 添加更多常见单词
        'application': ['ap', 'pli', 'ca', 'tion'],
        'organization': ['or', 'gan', 'i', 'za', 'tion'],
        'communication': ['com', 'mu', 'ni', 'ca', 'tion'],
        'international': ['in', 'ter', 'na', 'tion', 'al'],
        'responsibility': ['re', 'spon', 'si', 'bil', 'i', 'ty'],
        'understanding': ['un', 'der', 'stand', 'ing'],
        'environment': ['en', 'vi', 'ron', 'ment'],
        'government': ['gov', 'ern', 'ment'],
        'management': ['man', 'age', 'ment'],
        'department': ['de', 'part', 'ment'],
        'experience': ['ex', 'pe', 'ri', 'ence'],
        'opportunity': ['op', 'por', 'tu', 'ni', 'ty'],
        'community': ['com', 'mu', 'ni', 'ty'],
        'security': ['se', 'cu', 'ri', 'ty'],
        'quality': ['qual', 'i', 'ty'],
        'activity': ['ac', 'tiv', 'i', 'ty'],
        'society': ['so', 'ci', 'e', 'ty'],
        'economy': ['e', 'con', 'o', 'my'],
        'industry': ['in', 'dus', 'try'],
        'history': ['his', 'to', 'ry'],
        'memory': ['mem', 'o', 'ry'],
        'energy': ['en', 'er', 'gy'],
        'strategy': ['strat', 'e', 'gy'],
        'category': ['cat', 'e', 'go', 'ry'],
        'democracy': ['de', 'moc', 'ra', 'cy'],
        'philosophy': ['phi', 'los', 'o', 'phy'],
        'psychology': ['psy', 'chol', 'o', 'gy'],
        'biology': ['bi', 'ol', 'o', 'gy'],
        'chemistry': ['chem', 'is', 'try'],
        'mathematics': ['math', 'e', 'mat', 'ics'],
        'geography': ['ge', 'og', 'ra', 'phy'],
        'photography': ['pho', 'tog', 'ra', 'phy'],
        'architecture': ['ar', 'chi', 'tec', 'ture'],
        'literature': ['lit', 'er', 'a', 'ture'],
        'temperature': ['tem', 'per', 'a', 'ture'],
        'adventure': ['ad', 'ven', 'ture'],
        'furniture': ['fur', 'ni', 'ture'],
        'picture': ['pic', 'ture'],
        'nature': ['na', 'ture'],
        'culture': ['cul', 'ture'],
        'future': ['fu', 'ture'],
        'feature': ['fea', 'ture'],
        'structure': ['struc', 'ture'],
        'measure': ['meas', 'ure'],
        'pleasure': ['pleas', 'ure'],
        'treasure': ['treas', 'ure'],
        'pressure': ['pres', 'sure'],
        'mixture': ['mix', 'ture'],
        'texture': ['tex', 'ture'],
        'gesture': ['ges', 'ture'],
        'capture': ['cap', 'ture'],
        'departure': ['de', 'par', 'ture'],
        'signature': ['sig', 'na', 'ture'],
        'legislature': ['leg', 'is', 'la', 'ture'],
        'miniature': ['min', 'ia', 'ture'],
        'agriculture': ['ag', 'ri', 'cul', 'ture'],
        'manufacture': ['man', 'u', 'fac', 'ture']
    };

    // 如果在特殊字典中找到，直接返回
    if (specialCases[cleanWord]) {
        return specialCases[cleanWord];
    }

    try {
        // 使用 syllable 库获取音节数量
        const syllableCount = syllable(cleanWord);
        
        if (syllableCount <= 1) {
            return [word];
        }

        // 使用改进的算法进行音节分割
        return intelligentSyllableBreak(word, syllableCount);
        
    } catch (error) {
        console.warn('Syllable library error:', error);
        // 如果库出错，回退到基础算法
        return basicSyllableBreak(word);
    }
}

/**
 * 智能音节分割算法
 * 基于音节数量和语言学规则
 * @param {string} word - 单词
 * @param {number} targetSyllables - 目标音节数量
 * @returns {string[]} - 音节数组
 */
function intelligentSyllableBreak(word: string, targetSyllables: number): string[] {
    const vowels = 'aeiouAEIOU';
    const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
    
    // 找到所有元音位置
    const vowelPositions: number[] = [];
    for (let i = 0; i < word.length; i++) {
        if (vowels.includes(word[i])) {
            vowelPositions.push(i);
        }
    }

    if (vowelPositions.length === 0) {
        return [word];
    }

    if (vowelPositions.length === 1 || targetSyllables === 1) {
        return [word];
    }

    // 计算分割点
    const breakPoints: number[] = [];
    
    for (let i = 0; i < vowelPositions.length - 1; i++) {
        const currentVowel = vowelPositions[i];
        const nextVowel = vowelPositions[i + 1];
        
        // 在两个元音之间找最佳分割点
        const midPoint = Math.floor((currentVowel + nextVowel) / 2);
        
        // 寻找最近的辅音作为分割点
        let bestBreakPoint = midPoint;
        
        // 向左寻找辅音
        for (let j = midPoint; j > currentVowel; j--) {
            if (consonants.includes(word[j])) {
                bestBreakPoint = j;
                break;
            }
        }
        
        // 如果没找到，向右寻找
        if (bestBreakPoint === midPoint) {
            for (let j = midPoint; j < nextVowel; j++) {
                if (consonants.includes(word[j])) {
                    bestBreakPoint = j + 1;
                    break;
                }
            }
        }
        
        breakPoints.push(bestBreakPoint);
    }

    // 根据分割点切分单词
    const syllables: string[] = [];
    let start = 0;
    
    for (const breakPoint of breakPoints) {
        if (breakPoint > start) {
            syllables.push(word.substring(start, breakPoint));
            start = breakPoint;
        }
    }
    
    // 添加最后一个音节
    if (start < word.length) {
        syllables.push(word.substring(start));
    }

    // 如果音节数量不匹配，尝试调整
    if (syllables.length !== targetSyllables) {
        return adjustSyllableCount(syllables, targetSyllables);
    }

    return syllables.filter(s => s.length > 0);
}

/**
 * 调整音节数量以匹配目标
 * @param {string[]} syllables - 当前音节数组
 * @param {number} target - 目标音节数量
 * @returns {string[]} - 调整后的音节数组
 */
function adjustSyllableCount(syllables: string[], target: number): string[] {
    if (syllables.length === target) {
        return syllables;
    }

    if (syllables.length > target) {
        // 合并相邻的短音节
        while (syllables.length > target && syllables.length > 1) {
            let shortestIndex = 0;
            for (let i = 1; i < syllables.length - 1; i++) {
                if (syllables[i].length < syllables[shortestIndex].length) {
                    shortestIndex = i;
                }
            }
            
            if (shortestIndex === 0) {
                syllables[0] += syllables[1];
                syllables.splice(1, 1);
            } else {
                syllables[shortestIndex - 1] += syllables[shortestIndex];
                syllables.splice(shortestIndex, 1);
            }
        }
    } else {
        // 分割最长的音节
        while (syllables.length < target && syllables.length > 0) {
            let longestIndex = 0;
            for (let i = 1; i < syllables.length; i++) {
                if (syllables[i].length > syllables[longestIndex].length) {
                    longestIndex = i;
                }
            }
            
            const longest = syllables[longestIndex];
            if (longest.length > 2) {
                const mid = Math.floor(longest.length / 2);
                syllables[longestIndex] = longest.substring(0, mid);
                syllables.splice(longestIndex + 1, 0, longest.substring(mid));
            } else {
                break; // 无法进一步分割
            }
        }
    }

    return syllables.filter(s => s.length > 0);
}

/**
 * 基础音节分割算法（回退方案）
 * @param {string} word - 单词
 * @returns {string[]} - 音节数组
 */
function basicSyllableBreak(word: string): string[] {
    const vowels = 'aeiouAEIOU';
    const syllables: string[] = [];
    let currentSyllable = '';
    
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        currentSyllable += char;
        
        if (vowels.includes(char)) {
            if (i + 1 < word.length) {
                const nextChar = word[i + 1];
                if (!vowels.includes(nextChar) && i + 2 < word.length) {
                    const nextNextChar = word[i + 2];
                    if (vowels.includes(nextNextChar)) {
                        currentSyllable += nextChar;
                        syllables.push(currentSyllable);
                        currentSyllable = '';
                        i++;
                    }
                }
            }
        }
    }
    
    if (currentSyllable) {
        syllables.push(currentSyllable);
    }
    
    return syllables.length > 0 ? syllables : [word];
}

/**
 * 获取单词的音节数量
 * @param {string} word - 单词
 * @returns {number} - 音节数量
 */
export function getSyllableCount(word: string): number {
    try {
        return syllable(word);
    } catch (error) {
        console.warn('Error getting syllable count:', error);
        return advancedSyllabify(word).length;
    }
}

/**
 * 批量处理多个单词的音节分割
 * @param {string[]} words - 单词数组
 * @returns {Object} - 单词到音节数组的映射
 */
export function batchSyllabify(words: string[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    words.forEach(word => {
        result[word] = advancedSyllabify(word);
    });
    return result;
}
