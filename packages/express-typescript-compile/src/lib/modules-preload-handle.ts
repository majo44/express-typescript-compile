import { RequestHandler } from 'express';

/**
 * Serving the preload modules script.
 * @param preloadList - list of modules to preload
 */
export const modulesPreloadHandle = (preloadList: Array<string>): RequestHandler =>
    (req, res) => {
        res.contentType('application/javascript');
        res.send(preloadList.reduce((r, i) =>
            `${r}\ndocument.write('<link rel="modulepreload" href="${i}"/>');`, ''));
    };
