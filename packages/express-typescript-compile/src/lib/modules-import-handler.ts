import { RequestHandler } from 'express';
import { extname } from 'path';
import { Logger } from './logger';
import { ExpressTypescriptCompileOptions } from './options';
import { importContextQueryParam, importQueryParam } from './utils/get-url-for-file';

/**
 * Request handler which is responsible for serving es6 module source code.
 * @internal
 * @param config - configuration
 * @param sourceProvider - source provider
 * @param logger - logger
 */
export const modulesImportHandler = (
    config: Required<ExpressTypescriptCompileOptions>,
    sourceProvider: (file: string) => Promise<string>,
    logger: Logger): RequestHandler => {

    const { extensions } = config.resolve;

    return async (req, res, next) => {
        let source: string | undefined;

        const importQuery = req.query[importQueryParam];
        const importContextQuery = req.query[importContextQueryParam];

        req.moduleImport = !!importQuery;
        req.moduleImportContext = typeof importContextQuery === 'string'
            ? importContextQuery
            : undefined;

        const { path, originalUrl, moduleImport } = req;
        const ext = extname(path);

        try {
            if (moduleImport && (!extensions || extensions.indexOf(ext) > -1)) {
                logger.debug(`handling ${originalUrl} by moduleImport/extension match`);
                source = await sourceProvider(`${req.moduleImportContext || ''}${path}`);
            } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
                logger.debug(`handling ${originalUrl} by direct ts/tsx import match`);
                source = await sourceProvider(path);
            }
            if (source) {
                res.contentType('application/javascript');
                res.send(source);
            } else {
                next();
            }
        } catch (e: any) {
            logger.error(`problem with transpile a requested module ${originalUrl}`, e);
            res.statusCode = 500;
            res.send(`Problem with transpile a requested module ${originalUrl}: ${e.message}`);
        }
    };
}
