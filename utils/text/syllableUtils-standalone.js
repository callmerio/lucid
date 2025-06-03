/**
 * syllableUtils-standalone.js
 * 独立的音节分割工具，可在浏览器中直接使用
 * 包含改进的音节分割算法
 */

/**
 * 高级音节分割函数
 * @param {string} word - 要分割的单词
 * @returns {string[]} - 音节数组
 */
function advancedSyllabify(word) {
    if (!word || typeof word !== 'string') {
        return [word || ''];
    }

    const cleanWord = word.toLowerCase().trim();
    
    // 特殊情况处理
    if (cleanWord.length <= 1) {
        return [word];
    }

    // 预定义的特殊单词字典
    const specialCases = {
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

    // 使用改进的算法进行音节分割
    return intelligentSyllableBreak(word);
}

/**
 * 智能音节分割算法
 * 基于语言学规则的改进算法
 * @param {string} word - 单词
 * @returns {string[]} - 音节数组
 */
function intelligentSyllableBreak(word) {
    const vowels = 'aeiouAEIOU';
    const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
    
    // 找到所有元音位置
    const vowelPositions = [];
    for (let i = 0; i < word.length; i++) {
        if (vowels.includes(word[i])) {
            vowelPositions.push(i);
        }
    }

    if (vowelPositions.length <= 1) {
        return [word];
    }

    const syllables = [];
    let start = 0;

    for (let i = 0; i < vowelPositions.length - 1; i++) {
        const currentVowel = vowelPositions[i];
        const nextVowel = vowelPositions[i + 1];
        
        // 计算两个元音之间的辅音数量
        let consonantCount = 0;
        for (let j = currentVowel + 1; j < nextVowel; j++) {
            if (consonants.includes(word[j])) {
                consonantCount++;
            }
        }

        let breakPoint;
        
        if (consonantCount === 0) {
            // 没有辅音，在元音之间分割
            breakPoint = nextVowel;
        } else if (consonantCount === 1) {
            // 一个辅音，辅音跟随下一个元音
            breakPoint = nextVowel;
        } else {
            // 多个辅音，在中间分割
            const consonantStart = currentVowel + 1;
            while (consonantStart < nextVowel && !consonants.includes(word[consonantStart])) {
                consonantStart++;
            }
            
            if (consonantCount === 2) {
                // 两个辅音，在中间分割
                breakPoint = consonantStart + 1;
            } else {
                // 三个或更多辅音，在中间分割
                breakPoint = consonantStart + Math.floor(consonantCount / 2);
            }
        }

        // 确保分割点合理
        if (breakPoint > start && breakPoint < word.length) {
            syllables.push(word.substring(start, breakPoint));
            start = breakPoint;
        }
    }

    // 添加最后一个音节
    if (start < word.length) {
        syllables.push(word.substring(start));
    }

    // 过滤空音节并返回
    const result = syllables.filter(s => s.length > 0);
    return result.length > 0 ? result : [word];
}

/**
 * 估算单词的音节数量
 * 基于元音数量的简单估算
 * @param {string} word - 单词
 * @returns {number} - 估算的音节数量
 */
function estimateSyllableCount(word) {
    const vowels = 'aeiouAEIOU';
    let count = 0;
    let prevWasVowel = false;

    for (let i = 0; i < word.length; i++) {
        const isVowel = vowels.includes(word[i]);
        if (isVowel && !prevWasVowel) {
            count++;
        }
        prevWasVowel = isVowel;
    }

    // 处理静音 e
    if (word.toLowerCase().endsWith('e') && count > 1) {
        count--;
    }

    return Math.max(1, count);
}

// 如果在浏览器环境中，将函数添加到全局作用域
if (typeof window !== 'undefined') {
    window.advancedSyllabify = advancedSyllabify;
    window.intelligentSyllableBreak = intelligentSyllableBreak;
    window.estimateSyllableCount = estimateSyllableCount;
}
