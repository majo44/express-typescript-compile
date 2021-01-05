import fs from 'fs';
import { basename } from 'path';
import {
    CompilerOptions,
    CustomTransformerFactory,
    SourceFile,
    TransformerFactory, transpileModule
} from 'typescript';
import { promisify } from 'util';
import { Resolver } from './create-resolver';
import { createImportsTransformer } from './create-imports-transformer';

const readFile = promisify(fs.readFile);

/**
 * @internal
 */
export type Transpiler = (file: string) => Promise<string>

/**
 * Create source code transpiler.
 * @internal
 * @param cwd - working dir
 * @param compilerOptions - typescript compiler options
 * @param transformers - list of custom transformers
 * @param resolve - dependencies resolver
 * @param preloadList - list of modules to preload
 */
export const createTranspiler = (
    cwd: string,
    compilerOptions: CompilerOptions,
    transformers: Array<TransformerFactory<SourceFile> | CustomTransformerFactory>,
    resolve: Resolver,
    preloadList: Array<string>): Transpiler =>
    async (file): Promise<string> => {
        const source = (await readFile(file)).toString('utf8');
        const result = transpileModule(source, {
            fileName: basename(file),
            compilerOptions,
            transformers: {
                before: [
                    ...transformers,
                    createImportsTransformer(cwd, resolve, file, preloadList)
                ]
            }
        });
        return result.outputText;
    };
