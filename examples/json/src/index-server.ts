import { readFileSync } from 'fs';
import { join } from 'path';
import express from 'express';
import { typescriptCompileMiddleware } from 'express-typescript-compile';
// @ts-ignore
import jsonEs from 'json-es6-loader';

const port = 3000;
const cwd = process.cwd();
const app = express();

// dev - on the fly compilation
app.use(typescriptCompileMiddleware());

// serving json as es6 modules
app.get('*.json', (req, res, next) => {
    // checking is a module import request
    if (req.moduleImport) {
        // set proper content type
        res.contentType('application/javascript');
        // serve transformed json
        res.send(
            // transform json to es6 module
            jsonEs(
                // simple reading the file by the provided request path
                readFileSync(join(cwd, req.path)).toString('utf-8')));
        return;
    }
    next();
});

// index.html
app.get('/', (req, res) => res.sendFile(join(cwd, 'public/index.html')));

// server start
app.listen(port, () => console.log(`http://localhost:${port}`));
