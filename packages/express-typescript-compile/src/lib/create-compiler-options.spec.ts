import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import { CompilerOptions, JsxEmit, ModuleKind } from 'typescript';
import { createCompilerOptions, defaultCompilerOptions } from './create-compiler-options';
import { join } from 'path';
import { spy, SinonSpy } from 'sinon';
import { createLogger, LogLevel } from './logger';

use(sinonChai);

const mockLogger = createLogger(LogLevel.void);

describe('createCompilerOptions', () => {

    beforeEach(function() {
        spy(mockLogger, 'warn');
    });

    afterEach(function() {
        (mockLogger.warn as SinonSpy).restore();
    });

    it('on proper tsconfig should read proper configuration', () => {
        const config = createCompilerOptions(join(__dirname, '__mock__/projects/proper'), {}, mockLogger);
        expect(config).eql({
            configFilePath: join(__dirname, '__mock__/projects/proper/tsconfig.json').replace(/\\/g, '/'),
            jsx: JsxEmit.React,
            module: ModuleKind.ES2020,
            sourceMap: defaultCompilerOptions.sourceMap,
            target: defaultCompilerOptions.target
        });
    });


    describe('if not tsconfig file found', () => {

        let config: CompilerOptions | undefined;

        beforeEach(() => {
            config = createCompilerOptions(join(__dirname, '../../../'), {}, mockLogger);
        });

        it('should log warning', () => {
            expect(mockLogger.warn).to.be.callCount(1);
        });

        it('should prepare default config', () => {
            expect(config).eql({
                configFilePath: undefined,
                ...defaultCompilerOptions
            });
        });

    });

    describe('on non esm tsconfig', () => {
        let config: CompilerOptions | undefined;

        beforeEach(() => {
            config = createCompilerOptions(join(__dirname, '__mock__/projects/nonesm'), {}, mockLogger);
        });

        it('should log warning', () => {
            expect(mockLogger.warn).to.be.callCount(1);
        });

        it('should read proper configuration', () => {
            expect(config).eql({
                configFilePath: join(__dirname, '__mock__/projects/nonesm/tsconfig.json').replace(/\\/g, '/'),
                module: ModuleKind.CommonJS,
                sourceMap: defaultCompilerOptions.sourceMap,
                target: defaultCompilerOptions.target
            });
        });
    });

    it('on invalid tsconfig should throw error warning', () => {
        expect(() => createCompilerOptions(
            join(__dirname, '__mock__/projects/invalid'), undefined, mockLogger)).to.throw();
    });

    it('on custom path to config file should read it', () => {
        const config = createCompilerOptions(
            __dirname, {
                tsConfigFile: join(__dirname, '__mock__/projects/proper/tsconfig.json')
            }, mockLogger);
        expect(config).eql({
            configFilePath: join(__dirname, '__mock__/projects/proper/tsconfig.json').replace(/\\/g, '/'),
            jsx: JsxEmit.React,
            module: ModuleKind.ES2020,
            sourceMap: defaultCompilerOptions.sourceMap,
            target: defaultCompilerOptions.target
        });
    });

});
