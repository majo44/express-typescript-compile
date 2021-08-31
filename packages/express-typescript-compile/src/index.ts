import { Router } from 'express';
import { createCompilerOptions } from './lib/create-compiler-options';
import { createResolver } from './lib/create-resolver';
import { createSourceCodeProvider } from './lib/create-source-code-provider';
import { createTranspiler } from './lib/create-transpiler';
import { createLogger, Logger, LogLevel } from './lib/logger';
import { modulesPreloadHandle } from './lib/modules-preload-handle';
import {
    prepareConfig,
    ExpressTypescriptCompileOptions,
    CompileOptions,
    ResolveOptions,
    CachedValue,
    CacheOptions
} from './lib/options';
import { modulesImportHandler } from './lib/modules-import-handler';
export * from './lib/utils/get-url-for-file';

/**
 * Overloading global Express namespace to enhance the Request object declaration.
 */
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        export interface Request {
            /**
             * Is current request a request of es6 module import.
             */
            moduleImport?: boolean;
            /**
             * The relative path from cwd.
             */
            moduleImportContext?: string;
        }
    }
}

/**
 * Creates instance of typescript compile middleware.
 * @public
 * @param options - options of middleware
 * @param logger - logging target, default `console`
 */
export function typescriptCompileMiddleware(
    options: ExpressTypescriptCompileOptions = {},
    logger?: Logger): Router {

    const preloadList: Array<string> = [];
    const config: Required<ExpressTypescriptCompileOptions> = prepareConfig(options);
    const { cwd , compile, resolve, cache, logLevel } = config;
    const log = createLogger(logLevel, logger);
    const compilerOptions = createCompilerOptions(cwd, compile, log)
    const resolver = createResolver(cwd, compilerOptions, resolve, log);
    const transpiler = createTranspiler(
        cwd, compilerOptions, compile.transformers || [] , resolver, preloadList);
    const sourceProvider = createSourceCodeProvider(cwd, cache, transpiler);

    const router = Router({ mergeParams: true });

    router.get('/modules-preload', modulesPreloadHandle(preloadList));
    router.get('*', modulesImportHandler(config, sourceProvider, log));

    return router;
}

export {
    LogLevel
}

export type {
    Logger,
    ExpressTypescriptCompileOptions,
    CompileOptions,
    ResolveOptions,
    CachedValue,
    CacheOptions
}
