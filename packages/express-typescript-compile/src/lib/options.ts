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
     * Path to tsconfig.json file, default is tsconfig.json in working dir.
     */
    tsConfigFile?: string,
    /**
     * Overwrites for the tsconfig.json compilerOptions options.
     * For more info please look at {@link https://www.typescriptlang.org/tsconfig | TSConfig Reference}.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    compilerOptions?: any;
    /**
     * Custom additional source files transformers.
     */
    transformers?: Array<TransformerFactory<SourceFile> | CustomTransformerFactory>
}

/**
 * Options for node resolver.
 * For more info please go to {@link https://www.npmjs.com/package/enhanced-resolve | enhanced-resolve }
 * documentation.
 * @public
 */
export interface ResolveOptions extends Partial<ResolverResolveOptions> {
    /**
     * A list of module alias configurations or an object which maps key to value.
     */
    alias?:
        | { [index: string]: string | false | string[] }
        | {
        alias: string | false | string[];
        name: string;
        onlyModule?: boolean;
    }[];
    /**
     * A list of extensions which should be tried for files.
     * Default `['.ts', '.tsx', '.js', '.cjs', '.mjs']`.
     */
    extensions?: string[];
    /**
     * A list of main fields in description files.
     * Default `['browser', 'module', 'import', 'jsnext:main', 'main']`
     */
    mainFields?: (
        | string
        | string[]
        | { name: string | string[]; forceRelative: boolean }
        )[];
    /**
     * A list of exports field condition names.
     * Default: `['browser', 'module', 'import', 'node', 'default']`,
     */
    conditionNames?: string[];
}

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
     * Logging level.
     * Default `LogLevel.warn`
     */
    logLevel?: LogLevel;
    /**
     * Working dir.
     * @internal
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
            mainFields: ['browser', 'module', 'import', 'jsnext:main', 'main'],
            conditionNames: ['browser', 'module', 'import', 'node', 'default'],
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
        logLevel: config.logLevel || LogLevel.warn,
        cwd: config.cwd || process.cwd()
    };
}
