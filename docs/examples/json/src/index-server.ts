import { readFileSync } from 'fs';
import { join } from 'path';
import express from 'express';
import { typescriptCompileMiddleware } from 'express-typescript-compile';
import jsonEs from 'json-es6-loader';

// create server app
const app = express();

// dev - on the fly compilation
app.use(typescriptCompileMiddleware());

// handling *.json files
// if they are imported from the es modules
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
                readFileSync(join(process.cwd(), req.path)).toString('utf-8')));
        return;
    }
    next();
});

// index.html
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));

// server start
app.listen(3001);
