import { relative } from 'path';

/**
 * @internal
 */
export const importQueryParam = '__mi';

/**
 * @internal
 */
export const importContextQueryParam = '__mi_ctx';

/**
 * Generates import url for the provided file.
 * @param base - the base path
 * @param file - the path to file
 */
export const getUrlForFile = (base: string, file: string): string => {
    let resolved = relative(base, file);
    resolved = resolved.replace(/\\/g, '/');
    let context = '';
    while (resolved.startsWith(`../`)) {
        context += `../`;
        resolved = resolved.substr(3);
    }
    return `/${resolved}?${importQueryParam}=true${context ? `&${importContextQueryParam}=${context}` : ''}`;
}
