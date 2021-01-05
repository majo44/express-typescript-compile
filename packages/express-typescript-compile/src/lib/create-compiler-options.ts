import {
    CompilerOptions,
    findConfigFile, formatDiagnostics,
    ModuleKind,
    parseJsonConfigFileContent,
    readConfigFile,
    ScriptTarget,
    sys
} from 'typescript';
import { diagnosticToString, Logger } from './logger';
import { CompileOptions } from './options';


/**
 * Default compiler options.
 * @internal
 */
export const defaultCompilerOptions: CompilerOptions = {
    module: ModuleKind.ESNext,
    target: ScriptTarget.ES2016,
    sourceMap: false
}

/**
 * Prepare typescript compiler options.
 * @internal
 * @param cwd - running dir
 * @param options - custom compiler options
 * @param logger - logger
 */
export const createCompilerOptions = (
    cwd: string,
    options: CompileOptions = {},
    logger: Logger = console): CompilerOptions => {

    let { tsConfigFile } = options;
    let configJson: any = {
        compilerOptions: options.compilerOptions
    };

    // if not provided we will lookup for existing default
    if (!tsConfigFile) {
        tsConfigFile = findConfigFile(cwd, sys.fileExists);
    }
    // if no config throe message
    if (!tsConfigFile) {
        logger.warn('tsconfig.json not found ! ' +
            'The default minimal config will be used. ' +
            'You can provide tsconfig.json in working dir, ' +
            'or set custom path in options, like: typescriptCompileMiddleware({ compile: { tsConfigFile: \'./path/to/custom-tsconfig.json\'} })');
    } else {
        logger.debug(`tsconfig.json found: ${tsConfigFile}`);
        // reading config file
        const configFile = readConfigFile(tsConfigFile, sys.readFile);
        if (!configFile.error) {
            configJson = {
                ...configFile.config,
                compilerOptions: {
                    ...configFile.config.compilerOptions,
                    ...options.compilerOptions
                }
            }
        } else {
            throw new Error(
                `tsconfig.json parse error !\n${diagnosticToString([configFile.error], cwd) }`)
        }
    }

    // parse config file
    const parsedConfig = parseJsonConfigFileContent(configJson, {
        fileExists: sys.fileExists,
        readDirectory: sys.readDirectory,
        readFile: sys.readFile,
        useCaseSensitiveFileNames: false,
    }, cwd, undefined, tsConfigFile);

    const { module } = parsedConfig.options;

    // warn about improper module
    if (module === ModuleKind.CommonJS
        || module === ModuleKind.AMD
        || module === ModuleKind.System
        || module === ModuleKind.None
        || module === ModuleKind.UMD) {
        logger.warn('typescript compilerOptions \'module\' option is not ' +
            ' ES module, this will probably cause the problem with the script loading to the browser,' +
            ' please use ES2015, ES2020, or ESNext');
    }

    return {
        ...defaultCompilerOptions,
        ...parsedConfig.options
    };
}
