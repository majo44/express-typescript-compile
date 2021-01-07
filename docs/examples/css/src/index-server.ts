import express from 'express';
import { typescriptCompileMiddleware } from 'express-typescript-compile';

const app = express();

// dev - on the fly compilation
app.use(typescriptCompileMiddleware());

// so for all requests for the css files
// if the request will comes from es module (eg http://localhost/src/test.css?__mi=true)
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

// index.html
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));

// serving static files
// so src/test.css will be handled here
app.use(express.static('.'));

// server start
app.listen(3001);
