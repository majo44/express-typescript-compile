// src/index-server.ts
import express from 'express';
import { typescriptCompileMiddleware } from 'express-typescript-compile';

const app = express();

// dev - on the fly compilation
app.use(typescriptCompileMiddleware({
    resolve: {
        // provides aliases
        alias: {
            // we are mapping all import ... from 'react' to import ... from 'https://cdn.skypack.dev/react'
            'react': 'https://cdn.skypack.dev/react',
            // we are mapping all import ... from 'react-dom' to import ... from 'https://cdn.skypack.dev/react-dom'
            'react-dom': 'https://cdn.skypack.dev/react-dom'
        }
    }
}));

// index.html
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));

// server start
app.listen(3001);
