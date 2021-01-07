import express from 'express';
import { join } from 'path';
import liveReload from 'easy-livereload';
import { typescriptCompileMiddleware } from 'express-typescript-compile';

// create server app
const app = express();

// using easy-livereload middleware for the live reload of src files changes
app.use(liveReload({
    watchDirs: ['src' ].map(i => join(process.cwd(), i)),
    checkFunc: () => true,
}));

// dev - on the fly compilation
app.use(typescriptCompileMiddleware());

// index.html
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));

// server start
app.listen(3001);
