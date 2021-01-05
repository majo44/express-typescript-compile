import { createReadStream, readFileSync, statSync } from 'fs';
import { join } from 'path';
import express from 'express';
// @ts-ignore
import liveReload from 'easy-livereload';
import { LogLevel, typescriptCompileMiddleware } from 'express-typescript-compile';
import { cjsToEsmTransformerFactory } from 'cjstoesm';
// @ts-ignore
// import jsonEs from 'json-es6-loader';

const port = 3000;
const cwd = process.cwd();

const app = express();

// dev - live reload
app.use(liveReload({
    watchDirs: ['public', 'src/app'].map(i => join(cwd, i)),
    checkFunc: () => true,
}));

// dev - on the fly compilation
app.use(typescriptCompileMiddleware({
    compile: {
        transformers: [cjsToEsmTransformerFactory() ]
    },
    resolve: {
        alias: {
            'react': 'react/cjs/react.production.min.js',
            'react-dom': 'react-dom/cjs/react-dom.production.min.js',
            'scheduler': 'scheduler/cjs/scheduler.production.min.js'
        }
    },
    cache: {
        disabled: true
    },
    logLevel: LogLevel.debug
}));

// so for all requests for the css files
app.get('*.css', (req, res, next) => {
    // if the request is the es6 module import
    if (req.moduleImport) {
        // we will send proper content type
        res.contentType('application/javascript');
        // and simple js code which will create the link element
        // to the same path as was requested
        // but that time the link will be to plain css, not to es6 module
        res.send(`
            const link = document.createElement('link');
            link.setAttribute('href', '${req.path}');
            link.setAttribute('rel', 'stylesheet');
            document.body.append(link);
        `);
        return;
    }
    next();
});

// app.get('*.json', (req, res, next) => {
//     if (req.moduleImport) {
//         res.contentType('application/javascript');
//         res.send(jsonEs(readFileSync(join(cwd, req.path)).toString('utf-8')));
//         return;
//     }
//     next();
// });

// index.html
app.get('/', (req, res) => res.sendFile(join(cwd, 'public/index.html')));

// statics
app.use(express.static('.'));

// server start
app.listen(port, () => console.log(`http://localhost:${port}`));

// compile: {
//     // optionally we can overwrite compile options, in this case as chrome support es2020
//     compilerOptions: {target: 'ES2020'},
//     // optionally we can add transformers, this time we are using CJS, so we need cjs transformer
//     transformers: [cjsToEsmTransformerFactory()],
// },
