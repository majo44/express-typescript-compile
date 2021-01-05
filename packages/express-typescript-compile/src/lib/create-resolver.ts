import { CachedInputFileSystem, ResolverFactory } from 'enhanced-resolve';
import fs from 'fs';
import { dirname } from 'path';
import { CompilerOptions, createCompilerHost, Extension, nodeModuleNameResolver } from 'typescript';
import { Logger, loggerPrefix } from './logger';
import { ResolveOptions } from './options';

/**
 * Result of dependencies resolution.
 * @internal
 */
export interface Resolution {
    /**
     * path of cause module
     */
    context: string;
    /**
     * required dependency
     */
    target: string;
    /**
     * path to resolved module
     */
    resolution: string;
    /**
     * it is a absolute url
     */
    isUrl?: boolean;
    /**
     * is resolved by the typescript
     */
    isTypescript?: boolean;
    /**
     * is resolved by the node resolver
     */
    isNode?: boolean;
}

/**
 * Base resolver type.
 */
export type Resolver = (context: string, target: string) => Resolution;

/**
 * Create the dependencies resolver;
 * @internal
 * @param cwd - working dir
 * @param compilerOptions - compiler options
 * @param options - resolver options
 * @param logger - logger
 */
export function createResolver(
    cwd: string,
    compilerOptions: CompilerOptions,
    options: Partial<ResolveOptions>,
    logger: Logger): Resolver {

    /**
     * Prepare compiler host.
     */
    const compilerHost = createCompilerHost(compilerOptions);

    /**
     * Prepare base resolver
     */
    const resolver = ResolverFactory.createResolver({
        fileSystem: new CachedInputFileSystem(fs, 4000),
        useSyncFileSystemCalls: true,
        ...options
    });

    /**
     * Is checking alias is a absolute url.
     * @param target - target dependency
     */
    const checkAliasForUrl = (target: string): string | undefined => {
        let resolution: string | undefined;
        if (Array.isArray(options.alias)) {
            const alias = options.alias.find(i => i.name === target);
            if (alias && typeof alias.alias === 'string') {
                resolution = alias.alias
            }
        } else {
            const alias = options.alias?.[target];
            if (alias && typeof alias === 'string') {
                resolution = alias;
            }
        }
        if (resolution && (resolution.startsWith('http://') || resolution.startsWith('https://'))) {
            return resolution;
        }
    }

    return (context: string, target: string): Resolution => {
        const prefix =`import of: '${target}'\n from: '${context}\n`;
        // is a absolute url
        const urlAlias = checkAliasForUrl(target);
        if (urlAlias) {
            logger.debug(`${prefix} resolved by alias to: ${urlAlias}`);
            return { context, target, resolution: urlAlias, isUrl: true };
        }
        // is from ts/tsx module
        if (context.endsWith('.ts') || context.endsWith('.tsx')) {
            // try resolving by the typescript
            const tsResolution = nodeModuleNameResolver(target, context, compilerOptions, compilerHost);
            if (tsResolution?.resolvedModule?.resolvedFileName) {
                if (tsResolution.resolvedModule.extension !== Extension.Dts) {
                    logger.debug(`${prefix} resolved by typescript to: ${tsResolution.resolvedModule.resolvedFileName}`);
                    return {
                        isTypescript: true,
                        context, target, resolution: tsResolution.resolvedModule.resolvedFileName
                    }
                }
            }
        }
        try {
            // try resolving by the node
            const nodeResolution = resolver.resolveSync({}, dirname(context), target);
            if (nodeResolution) {
                logger.debug(`${prefix} resolved by enhanced-resolver to: ${nodeResolution}`);
                return {
                    isNode: true,
                    context, target, resolution: nodeResolution
                }
            }
        // eslint-disable-next-line no-empty
        } catch (e) {}

        logger.error(`${prefix} not resolved !!!`);
        throw new Error(`${loggerPrefix} resolution not found for ${target} imported by ${context}`);
    };
}
