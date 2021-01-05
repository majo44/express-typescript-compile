import type { ResolveOptions as ResolverResolveOptions } from 'enhanced-resolve';
import type {
    CustomTransformerFactory,
    SourceFile,
    TransformerFactory
} from 'typescript';
import { LogLevel } from './logger';

/**
 * Compiler options.
 * @public
 */
export interface CompileOptions {
    /**
     * Path to tsconfig.json file, default is tsconfig.json in working dir
     */
    tsConfigFile?: string,
    /**
     * Overwrites for the tsconfig.json
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    compilerOptions?: any;
    /**
     * Custom additional source files transformers
     */
    transformers?: Array<TransformerFactory<SourceFile> | CustomTransformerFactory>
}

/**
 * Options for node resolver.
 * For more info please go to {@link https://www.npmjs.com/package/enhanced-resolve | enhanced-resolve }
 * documentation.
 * @public
 */
export type ResolveOptions = Partial<ResolverResolveOptions>

/**
 * Value stored in cache.
 * @public
 */
export interface CachedValue {
    /**
     * Last update timestamp.
     */
    timestamp: number;
    /**
     * Transpiled code.
     */
    source: string;
}

/**
 * Caching options.
 * @public
 */
export interface CacheOptions {
    /**
     * Disable cache.
     */
    disabled?: boolean;
    /**
     * Cache provider. By default simple memory cache is used.
     */
    provider?: {
        /**
         * Set value to cache.
         */
        set: (key: string, value: CachedValue) => void;
        /**
         * Get value trom cache.
         */
        get: (key: string) => Promise<CachedValue | undefined>;
    }
}

/**
 * Middleware configuration options.
 * @public
 */
export interface ExpressTypescriptCompileOptions {
    /**
     * Options for compiler.
     */
    compile?: CompileOptions;
    /**
     * Options for the dependencies resolver.
     */
    resolve?: ResolveOptions;
    /**
     * Options for cache.
     */
    cache?: CacheOptions;
    /**
     * Logging level
     */
    logLevel?: LogLevel;
    /**
     * Working dir.
     */
    cwd?: string;
}

/**
 * Prepare the configuration options.
 * @param config - user config
 * @internal
 */
export function prepareConfig(config: ExpressTypescriptCompileOptions): Required<ExpressTypescriptCompileOptions> {
    const cache: Record<string, CachedValue> = {};
    return {
        compile: {
            ...config.compile
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.cjs', '.mjs'],
            mainFields: ['module', 'main'],
            ...config.resolve
        },
        cache: {
            disabled: false,
            provider: {
                get: (key) => Promise.resolve(cache[key]),
                set: (key,  value) => cache[key] = value
            },
            ...config.cache
        },
        logLevel: config.logLevel || LogLevel.info,
        cwd: config.cwd || process.cwd()
    };
}
