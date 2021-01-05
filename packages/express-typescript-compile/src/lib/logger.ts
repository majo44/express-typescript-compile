import { Diagnostic, formatDiagnostics } from 'typescript';

/**
 * @internal
 */
export type Logger = Pick<Console, 'warn' | 'error' | 'info' | 'debug'>

/**
 * @public
 */
export type LogLevel =  1 | 2 | 3 | 4 | 5;

/**
 * @public
 */
export const LogLevel = {
    void: 1,
    error: 2,
    warn: 3,
    info: 4,
    debug: 5,
} as const;

/**
 * @internal
 */
export const loggerPrefix = 'express-typescript-compile:';

/**
 * @internal
 */
export const diagnosticToString = (diagnostics: readonly Diagnostic[], cwd: string): string => {
    return formatDiagnostics(diagnostics, {
        getCanonicalFileName: (fileName: string) => fileName,
        getCurrentDirectory: () => cwd,
        getNewLine: () => '\n'
    })
}

/**
 * @internal
 * @param level - logging level
 * @param baseLogger - base logger
 */
export const createLogger = (level: LogLevel = LogLevel.warn, baseLogger: Logger = console): Logger =>
    (['debug', 'info', 'warn', 'error'] as const).reduce((logger, key) => ({
        ...logger,
        [key]: (...data: any[]): void => {
            if (level > (LogLevel[key] - 1)) {
                baseLogger[key](loggerPrefix, ...data);
            }
        }
    }), {} as Logger);
