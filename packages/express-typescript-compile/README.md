# express-typescript-compile
Express.js on the fly typescript compilation middleware. [Full documentation](https://majo44.github.io/express-typescript-compile/#/).

## Introduction
The main purpose of this package is to give ability for super simple, cheep and fast typescript
code running, both, on the server and client side, without need of special
configuration of project, like configuration for the bundler, compiler, without need of tons of
dependencies.

This package delivers express.js middleware which on the fly, during the request, transpile typescript
source file to the javascript code. Such transpiled source is cached and retranspiled only after
the changes. As transpilation is not cheep, such approach should be only use within the development
workflow, or for prototyping or demoing. On side, you can have the production configuration,
with the compiler, bundler, linter ect.

## Features
* typescript/js code on the fly transpilation
* minimal configuration
* simple memory caching
* tsconfig paths support
* dynamic imports `import('abc')` support
* support common.js modules imports by aliasing or/and transformers
* support json modules imports
* support css imports
* no impact on the code, and development workflow
* rich configuration

## Installation

```bash
npm install express-typescript-compile
```

## Usage

You can find bunch examples [here](https://majo44.github.io/express-typescript-compile/#/examples/).

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

```text
// tsconfig.json
{
    "compilerOptions": {
        // Required just because of 'express' import 
        "esModuleInterop": true,
        // As we are transpiling file by file, we have to use isolatedModules option
        "isolatedModules": true
    }
}
```
```text
// package.json
{
   "scripts": {
      // runing server code by the ts-node-dev (or ts-node)
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

For more information please go to [Api Reference](https://majo44.github.io/express-typescript-compile/#/api/index).


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
offers the es modules you have options.

#### Use import-maps
The modern browsers supports the imports-maps.

```typescript
// src/index-server.ts
...
// dev - on the fly compilation
app.use(typescriptCompileMiddleware({
   resolve: {
       // marking libs as externals
       externals: ['react', 'react-dom' ]
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
<head>
   <!-- Import maps -->
   <script type="importmap">
        {
            "imports": {
                "react": "https://cdn.skypack.dev/react", // can be also /node_modules/react/...
                "react-dom": "https://cdn.skypack.dev/react-dom"
            }
        }
    </script>
</head>
<body>
    <!-- Just import the tsx module -->
    <script type="module" src="/src/index-client.tsx"></script>
</body>
</html>
```

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
Transforming solution will not always solve the problem, some libraries (eg `React`) can't be handled
properly by the `cjstoesm` as the code contains the conditional imports/exports.
If we can't or do not want to use [skypack.dev](https://www.skypack.dev/) cdn, we can try to mix
transformers with aliases, which will firstly map imports to file which are easy to handle by the
`cjstoesm`, and then use `cjstoesm` transform for converts that files from common.js in to es modules.
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

## How it works
1. the middleware on the *.ts, *.tsx files requests (eg. `http://localhost:3000/src/index.ts`) is
2. looking in cache and working dir for the file by the `request.path` (and `__mi_ctx` query parameter) (eg. `./src/index.ts`)
3. transpile file to es module (respecting tsconfig options) by the `typescript` package
4. resolving all imports from the file by the aliases/typescript/enhanced-resolver
5. replacing all imports by resolved value and mark them by special (`__mi`) query parameter
   (eg. `import { app } from '/src/app/index.ts?__mi=true`,  
   `import { crateElement } from '/node_modules/react/cjs/react.production.min.js?__mi=true`)
6. if import is resolved to upper dir the additional (`__mi_ctx`) query param is added   
   (eg.
   `import { crateElement } from '/node_modules/react/cjs/react.production.min.js?__mi=true&__mi_ctx=../../`)
6. caching file
6. on the next request to marked resource > go to 2.
