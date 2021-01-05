import { RequestHandler } from 'express';
import { extname } from 'path';
import { importContextQueryParam, importQueryParam } from './create-imports-transformer';
import { ExpressTypescriptCompileOptions } from './options';

/**
 * Request handler which is responsible for serving es6 module source code.
 * @internal
 * @param config - configuration
 * @param sourceProvider - source provider
 */
export const modulesImportHandler = (
    config: Required<ExpressTypescriptCompileOptions>,
    sourceProvider: (file: string) => Promise<string>): RequestHandler =>
    async (req, res, next) => {
        let source: string | undefined;

        const importQuery = req.query[importQueryParam];
        const importContextQuery = req.query[importContextQueryParam];

        req.moduleImport = !!importQuery;
        req.moduleImportContext = typeof importContextQuery === 'string'
            ? importContextQuery
            : undefined;

        const ext = extname(req.path);
        if (req.moduleImport
            && (config.resolve?.extensions?.indexOf(ext) || -1) > -1) {
            source = await sourceProvider(`${req.moduleImportContext || ''}${req.path}`);
        } else if (req.path.endsWith('.ts') || req.path.endsWith('.tsx')) {
            source = await sourceProvider(req.path);
        }
        if (source) {
            res.contentType('application/javascript');
            res.send(source);
        } else {
            next();
        }
    };
