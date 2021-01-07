// src/index-server.ts
import express from 'express';
import { typescriptCompileMiddleware } from 'express-typescript-compile';
import { cjsToEsmTransformerFactory } from "cjstoesm";

const app = express();

// dev - on the fly compilation
app.use(typescriptCompileMiddleware({
    resolve: {
        alias: {
            // forcing import of production bundles as cjstoesm is not
            // able to handle development versions
            'react': 'react/cjs/react.production.min.js',
            'react-dom': 'react-dom/cjs/react-dom.production.min.js',
            'scheduler': 'scheduler/cjs/scheduler.production.min.js'
        }
    },
    compile: {
        // adding the common.js to es modules transform
        transformers: [ cjsToEsmTransformerFactory() ]
    }
}));

// index.html
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));

// server start
app.listen(3001);
