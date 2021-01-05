# express-typescript-compile
Express.js on the fly typescript compilation middleware. 

## Introduction
The main porpoise of this package is to give ability for super simple, cheep and fast be able to 
run the typescript code, both on the server and client side, without need of the project special 
configuration, like configuration for the bundler, compiler ect. without need of tons of 
dependencies. 

This is simple small express.js middleware which on the fly, during the request, compile typescript 
source file to the javascript code. Such compiled source is cached and recompiled only after 
the changes. As this process is not cheep such approach should be only use within the development 
workflow, or for prototyping or demoing. On side, you can have the production configuration.    

## Installation

```bash
npm install express-typescript-compile
```

## Usage
### Example minimal setup
This is an example of minimal runnable example of `express-typescript-compile` usage.
In this example we are running the server typescript code trough `ts-node-dev`, and client code is 
on the fly compiled by the `express-typescript-compile`.
```
├── src
│   ├── index-client.ts    // client side entrypoint
│   └── index-server.ts    // server entry point
├── index.html             // client entry html page
├── package.json           // project package.json
└── tsconfig.json          // tsconfig
```

```typescript
// src/index-client.ts
console.log('Hello word');
export {}
```

```html
// index.html
<!DOCTYPE html>
<html lang="en">
<head></head>
<body>
    <!-- Import of typescript module -->
    <script type="module" src="/src/index-client.ts"></script>
</body>
</html>
```

```typescript
// src/index-server.ts
import express from 'express';
import { typescriptCompileMiddleware } from 'express-typescript-compile';
const app = express();
// dev - on the fly compilation
app.use(typescriptCompileMiddleware());
// index.html
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));
// server start
app.listen(3000);
```

```json
// tsconfig.json
{
    "compilerOptions": {
        // This minimal config is required just because of 'express' import 
        "esModuleInterop": true
    }
}
```
```json
// package.json
{
   "scripts": {
      "serve": "ts-node-dev -- src/index-server.ts"
   },
   "dependencies": {
      "express": "^4.17.1",
      "tslib": "^2.0.3"
   },
   "devDependencies": {
      "@types/express": "^4.17.9",
      "typescript": "^4.1.3",
      "express-typescript-compile": "0.1.0",
      "ts-node-dev": "^1.1.1"
   }
}

```

## Live reload
In order to use live page reload technique please use `easy-livereload` package like:
```typescript
import liveReload from 'easy-livereload';
...
app.use(liveReload({
    watchDirs: ['public', 'src/app'].map(i => join(process.cwd(), i)),
    checkFunc: () => true,
}));
```

## Import non typescript/es6 modules

This package by self is resolving only the imports to your source typescript modules, and to 
installed packages which are exports the es6 modules, as such modules are fully supported by the 
modern browsers. You still are able to import the commonjs, json, css, ... but you will need to 
handle that by self, please look at the fallowing list of recipes for more details:

### Common.js modules
If your code is tries to import the common.js modules which are coming from the package which is not 
offers the es modules you have two options.

#### Aliasing
`typescriptCompileMiddleware` provides the way for configuring the aliases. Such aliases can map 
imports to the local files, but also to the public url, eg. to cdn. As we have 
[skypack.dev](https://www.skypack.dev/) we can use it to import es version of the common.js packages

```typescript
// src/index-server.ts
...
// dev - on the fly compilation
app.use(typescriptCompileMiddleware({
   resolve: {
      alias: {
          // we are mapping all import ... from 'react' to import ... from 'https://cdn.skypack.dev/react' 
         'react': 'https://cdn.skypack.dev/react',
         // we are mapping all import ... from 'react-dom' to import ... from 'https://cdn.skypack.dev/react-dom' 
         'react-dom': 'https://cdn.skypack.dev/react-dom'
      }
   }
}));
...
```
```typescript jsx
// src/index-client.tsx
import { createElement } from 'react';
import { render } from 'react-dom';

const root = document.createElement('div');
document.body.append(root)
render(<div>Hello word</div>, root);
```
```html
<!DOCTYPE html>
<html lang="en">
<head></head>
<body>
    <!-- Just import the tsx module -->
    <script type="module" src="/src/index-client.tsx"></script>
</body>
</html>

```
#### Transform common.js to es modules
`typescriptCompileMiddleware` provides the way for configuring custom transformers. There is package 
called `cjstoesm` which is a transformer of common.js to es modules, and it is compatible with
typescriptCompileMiddleware. Unfortunately `cjstoesm` has some limitation, please read documentation
for better info.
```typescript
// src/index-server.ts
import { cjsToEsmTransformerFactory } from "cjstoesm";

// dev - on the fly compilation
app.use(typescriptCompileMiddleware({
   compile: {
      // adding the common.js to es modules transform
      transformers: [ cjsToEsmTransformerFactory() ]
   }
}));
```

#### Mixing both techniques
Transforming solution will not always solve the problem, some libraries (eg React) can't be handled
properly by the `cjstoesm` as the code contains the conditional imports/exports. 
If we can't or do not want to use [skypack.dev](https://www.skypack.dev/) cdn, we can try to mix 
aliases, which will firstly map imports to files which are easy to handle by the `cjstoesm`, and then 
use `cjstoesm` transform for converts that files from common.js in to es modules.
```typescript
// src/index-server.ts
import { cjsToEsmTransformerFactory } from "cjstoesm";

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
```

### Json
To import json modules directly to your typescript module you have to 
1. Enable `resolveJsonModule` option in your tsconfig.json
2. Deliver the express middleware which will transform the json files in to the es6 modules on the fly, 
   you can use package called `json-es6-loader`:
   ```typescript
    import jsonEs from 'json-es6-loader';
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
    ```

### Css 
To import css files directly from your typescript source code you will have to
1. To preserve compilation error we will create the typescript global declaration like `global.d.ts`:
    ```typescript
    declare module "*.css";
    ```
2. As the `express-typescript-compile` middleware will leave imports to the `*.css` within es6 modules, 
   we will need to serve es6 modules which are represents `*.css` 
   files. So we will add an express middleware:
    ```typescript
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
    ```
3. Last think which we have to do is to serve regular `*.css` file, so we can add simple static 
   files middleware:
   ```typescript
    app.use(express.static('.'));
    ```
   
## TBC....
