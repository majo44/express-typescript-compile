import {
    getJSDocTags,
    isCallExpression,
    isExportDeclaration,
    isImportDeclaration,
    isStringLiteral,
    Node,
    SourceFile,
    SyntaxKind,
    TransformationContext,
    TransformerFactory,
    visitEachChild
} from 'typescript';

import {Resolver} from './create-resolver';
import {getUrlForFile} from './utils/get-url-for-file';

/**
 * Create source code transformer
 * @internal
 * @param cwd - working dir
 * @param resolve - dependencies resolver
 * @param file - target file
 * @param preloadList - list modules to preload
 */
export function createImportsTransformer(
    cwd: string,
    resolve: Resolver,
    file: string,
    preloadList: Array<string>): TransformerFactory<SourceFile> {

    const checkIgnore = (node: Node) => {
        const tags = getJSDocTags(node);
        for (const tag of tags) {
            if (tag?.tagName?.escapedText === 'etc-ignore') {
                return true;
            }
        }
        return false;
    }

    /**
     * Creates import url.
     * @param target - for the dependency
     */
    const url = (target: string ): string => {
        let url: string | undefined;
        const resolution = resolve(file, target);
        if (resolution.isExternal) {
            url = resolution.resolution;
        } else  if (resolution.isUrl) {
            url = resolution.resolution;
        } else {
            url = getUrlForFile(cwd, resolution.resolution);
        }
        if (preloadList.indexOf(url) < 0) {
            preloadList.push(url);
        }
        return url;
    }

    return (context: TransformationContext) => {
        // creates visitor
        const visitor = <T extends Node>(node: T): T | undefined => {
            // dynamic import call
            if (isCallExpression(node) && node.expression.kind === SyntaxKind.ImportKeyword) {
                if (checkIgnore(node)) {
                    return undefined;
                }
                const [arg, ...rest] = node.arguments;
                if (isStringLiteral(arg)) {
                    return context.factory.updateCallExpression(
                        node, node.expression, node.typeArguments, [
                            context.factory.createStringLiteral(url(arg.text)), ...rest]) as typeof node;
                }
                // todo report problematic import
            }
            // export ... from ...
            if (isExportDeclaration(node) && !node.isTypeOnly) {
                if (checkIgnore(node)) {
                    return undefined;
                }
                const moduleSpecifier = node.moduleSpecifier;
                if (moduleSpecifier && isStringLiteral(moduleSpecifier)) {
                    return context.factory.updateExportDeclaration(
                        node, node.modifiers, node.isTypeOnly, node.exportClause,
                        context.factory.createStringLiteral(url(moduleSpecifier.text)),
                        node.assertClause) as typeof node;
                }
            }
            // import ... from ...
            if (isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
                if (checkIgnore(node)) {
                    return undefined;
                }
                const moduleSpecifier = node.moduleSpecifier;
                if (isStringLiteral(moduleSpecifier)) {
                    return context.factory.updateImportDeclaration(
                        node, node.modifiers, node.importClause,
                        context.factory.createStringLiteral(url(moduleSpecifier.text)),
                        node.assertClause) as typeof node;
                }
                return node;
            }

            return visitEachChild(node, visitor, context);
        };

        return <T extends Node>(node: T) => {
            return visitEachChild(node, visitor, context);
        }
    };
}
