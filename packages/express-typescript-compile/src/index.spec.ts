import { expect, use } from 'chai';
import express from 'express';
import sinonChai from 'sinon-chai';
import { CompilerOptions, JsxEmit, ModuleKind, ScriptTarget } from 'typescript';
import * as ts from 'typescript/lib/protocol';
import { join } from 'path';
import { spy, SinonSpy } from 'sinon';
import { agent } from 'supertest'

describe('typescriptCompileMiddleware', () => {
    it('', () => {
        const app = express();

    })
});
