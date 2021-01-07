import express from 'express';
import { typescriptCompileMiddleware } from 'express-typescript-compile';

// create server app
const app = express();

// dev - on the fly compilation
app.use(typescriptCompileMiddleware());

// index.html
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));

// server start
app.listen(3001);
