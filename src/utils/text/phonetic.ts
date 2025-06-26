/**
 * phoneticUtils.ts
 * 音标格式化工具函数
 */

/**
 * 格式化音标，智能判断是否需要添加斜杠
 * @param phonetic 原始音标字符串
 * @returns 格式化后的音标字符串
 */
export function formatPhonetic(phonetic: string): string {
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

/**
 * 移除音标的斜杠
 * @param phonetic 带斜杠的音标字符串
 * @returns 不带斜杠的音标字符串
 */
export function removePhoneticSlashes(phonetic: string): string {
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

/**
 * 检查音标是否已经有斜杠格式
 * @param phonetic 音标字符串
 * @returns 是否已经有斜杠格式
 */
export function hasPhoneticSlashes(phonetic: string): boolean {
    if (!phonetic || typeof phonetic !== 'string') {
        return false;
    }
    
    const trimmed = phonetic.trim();
    return trimmed.startsWith('/') && trimmed.endsWith('/');
}

/**
 * 批量格式化音标对象
 * @param phoneticObj 包含多个音标的对象
 * @returns 格式化后的音标对象
 */
export function formatPhoneticObject(phoneticObj: Record<string, string>): Record<string, string> {
    const formatted: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(phoneticObj)) {
        formatted[key] = formatPhonetic(value);
    }
    
    return formatted;
}
