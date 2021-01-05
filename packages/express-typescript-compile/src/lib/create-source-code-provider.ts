import fs from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { CacheOptions } from './options';

const readStats = promisify(fs.stat);

/**
 * Provider of source code
 * @internal
 */
export type SourceCodeProvider = (file: string) => Promise<string>;

/**
 * Create source code provider.
 * @internal
 * @param cwd - working directory
 * @param transpile - typescript/es transpile function
 * @param options - transpile options
 */
export const createSourceCodeProvider = (
    cwd: string,
    options: CacheOptions,
    transpile: (file: string) => Promise<string>): SourceCodeProvider =>
    async (file: string): Promise<string> => {
        file = join(cwd, file);
        if (!options.disabled && options.provider) {
            let cachedValue = await options.provider.get(file);
            const stats = await readStats(file);
            if (!cachedValue || cachedValue.timestamp < stats.mtimeMs) {
                cachedValue = {timestamp: stats.mtimeMs, source: await transpile(file)};
                options.provider.set(file, cachedValue);
            }
            return cachedValue.source;
        }
        return transpile(file);
    };
