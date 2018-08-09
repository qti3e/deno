import * as ts from "typescript";
import { extractCJSExports, exportsSym, moduleSym } from "./cjs";
import { resolveModule } from "./parser";
import * as types from "./types";
import * as _ from "./util";

// This file contains helper functions to work
// with typescript AST.
// tslint:disable:curly

/**
 * Pre process a sourceFile, and inserts
 * some informations to its childs, so we
 * can use those information later.
 * Note: You must only pass `sourceFile`
 *   parameter when using this function,
 *   other parameters are internal.
 */
export function preProcessSourceFile(
  node: ts.Node,
  parent?: ts.Node,
  scope?: ts.Scope
): void {
  if (node.deno) return;
  // Set NodeInfo
  node.deno = true;
  node.scope = scope;
  node.parent = parent;
  if (_.isScopeNode(node)) {
    scope = node;
    scope.locals = new Map() as ts.Map<ts.LocalNode>;
    scope.exports = new Map() as ts.Map<ts.ExportNode>;
  }
  
  if (ts.isSourceFile(node)) {
    node.locals.set("exports", exportsSym);
    node.locals.set("module", moduleSym);
  }

  // Ignore useless information.
  if (_.isJunkNode(node)) return;

  if (ts.isImportClause(node)) {
    // import X from "foo";
    if (node.name) {
      scope.locals.set(node.name.text, node);
    }
  } else if (ts.isNamespaceImport(node)) {
    // import * as X from "foo";
    scope.locals.set(node.name.text, node);
  } else if (ts.isImportSpecifier(node)) {
    // import { X } from "foo";
    scope.locals.set(node.name.text, node);
  } else if (_.isDeclaration(node)) {
    // const x = foo;
    // function x() {}
    // etc...
    let name: string;
    if (node.name && ts.isIdentifier(node.name)) {
      name = node.name.text;
      scope.locals.set(name, node);
    }
    if (_.isExported(node)) {
      // export default class {}
      // export function X() {}
      if (_.isDefault(node)) name = "default";
      if (!name) return;
      scope.exports.set(name, node);
    }
  } else if (ts.isExportAssignment(node)) {
    // export = X;
    scope.exports.clear();
    scope.exports.set("export=", node);
  } else if(ts.isExportDeclaration(node)) {
    // export * from "foo";
    // export { X as Y } from "foo";
    // export { default as Y } from "foo";
    // export { X as Y }
    if (node.exportClause && !node.moduleSpecifier) {
      // export { P as X };
      const elements = node.exportClause.elements;
      for (const exportSpecifier of elements) {
        const localName = exportSpecifier.propertyName || exportSpecifier.name;
        scope.exports.set(exportSpecifier.name.text, localName);
      }
    } else if (node.moduleSpecifier) {
      // export * from "foo";
      const sourceFile = resolveModule(node.moduleSpecifier);
      sourceFile.exports.forEach((exportedNode, name) => {
        scope.exports.set(name, exportedNode);
      });
    } else {
      // export { P } from "B";
      const sourceFile = resolveModule(node.moduleSpecifier);
      const elements = node.exportClause.elements;
      for (const exportSpecifier of elements) {
        const localName = exportSpecifier.propertyName || exportSpecifier.name;
        let name = localName.text;
        if (!sourceFile.exports.has(name)) {
          if (name === "default" && sourceFile.exports.has("export=")) {
            name = "export=";
          } else {
            throw new Error(
              `Module "${sourceFile.fileName}" has no exported` +
              ` member "${name}".`
            );
          }
        }
        scope.exports.set(
          exportSpecifier.name.text,
          sourceFile.exports.get(name)
        );
      }
    }
  }

  // TODO(qti3e) ExportNamespaceSpecifier (JS/ES6 only)
  // export * as X from "foo";
  //
  // TODO(qti3e) ImportEqualsDeclaration.
  // import X = require("foo");
  // 
  // TODO(qti3e) Maybe look inside IFEEs?
  // (function(){ module.exports = ...; })(module);

  // Visit childs
  ts.forEachChild(node, (childNode) => {
    preProcessSourceFile(childNode, node, scope);
  });

  // To support CommonJS
  if (ts.isSourceFile(node)) {
    // Attempt to extract CommonJS exports only
    // when there is no export declaration in
    // current source file.
    if (node.exports.size > 0) return;
    // Support CommonJS on .js/.jsx files.
    if (node.scriptKind === ts.ScriptKind.JS ||
      node.scriptKind === ts.ScriptKind.JSX) {
      extractCJSExports(node);
    }
  }
}

/**
 * Returns a node where the given node is defined.
 * Note: It does not follow imports
 *
 * @see findDeclaration
 */
export function findDefinition(node: ts.Identifier): ts.Node {
  if (node.def) return node.def;
  let tmp: any = node;
  // By default, we visit all parents of the node with the hope
  // of finding a typeParameter, on the other hand, we know that
  // after visiting first ModuleDeclaration, we won't see any
  // typeParameter, so after that we just jump straight to
  // node.scope instead of node.parent.
  let visitParent = true;
  while (tmp) {
    // Note: There is no need to check node.parameters
    // we never go inside a function (or block).
    if (tmp.locals) visitParent = false;
    if (tmp.locals && tmp.locals.has(node.text)) {
      node.def = tmp.locals.get(node.text);
      break;
    }
    if (!visitParent) {
      tmp = tmp.scope;
      continue;
    }
    if (tmp.typeParameters) {
      for (const typeParameter of tmp.typeParameter) {
        if (typeParameter.name.text === node.text) {
          node.def = typeParameter;
          break;
        }
      }
    }
    tmp = tmp.parent;
  }
  if (!node.def) {
    throw new Error(`Name ${node.text} is used, but it's never defined.`);
  }
  return node.def;
}

/**
 * Returns file name of the node.
 */
export function getFileName(node: ts.Identifier): types.Reference {
  const definition = findDefinition(node);
  let moduleSpecifier;
  let propertyName: string = node.text;
  if (ts.isImportClause(definition)) {
    // import X from "foo";
    moduleSpecifier = definition.parent.moduleSpecifier;
    propertyName = "default";
  } else if (ts.isNamespaceImport(definition)) {
    // import * as X from "foo";
    moduleSpecifier = definition.parent.parent.moduleSpecifier;
    propertyName = "";
  } else if (ts.isImportSpecifier(definition)) {
    // import { X } from "foo";
    moduleSpecifier = definition.parent.parent.parent.moduleSpecifier;
    propertyName = (definition.propertyName || definition.name).text;
  }
  if (ts.isStringLiteral(moduleSpecifier)) {
    return {
      fileName: moduleSpecifier.text,
      name: propertyName,
      isLocal: false,
      moduleSpecifier
    };
  }
  const name = [node.text];
  let fileName: string;
  let tmp = node.scope;
  while (tmp) {
    if (ts.isModuleDeclaration(tmp)) {
      name.push(tmp.name.text);
    } else {
      fileName = tmp.fileName;
    }
    tmp = tmp.scope;
  }
  name.reverse();
  return {
    fileName,
    name: name.join("."),
    isLocal: true
  };
}

/**
 * Returns final definition of an identifier.
 * The main difference between this function and findDefinition is:
 * 1) It follows imports
 * 2) In case of VariableDeclaration it returns its initializer when
 *    it's just an identifier.
 *
 * @see findDefinition
 */
export function findDeclaration(
  node: ts.Identifier
): ts.DenoDeclaration | symbol {
  const definition = findDefinition(node);
  if (typeof definition === "symbol") {
    return definition;
  }
  if (ts.isVariableDeclaration(definition)) {
    if (ts.isIdentifier(definition.initializer)) {
      return findDeclaration(definition.initializer);
    } else if (ts.isArrowFunction(definition.initializer) ||
      ts.isFunctionExpression(definition.initializer) ||
      ts.isFunctionDeclaration(definition.initializer)) {
      return definition.initializer;
    }
    return definition;
  } else if (_.isDeclaration(definition)) {
    return definition;
  }
  const { moduleSpecifier, isLocal, name } = getFileName(node);
  if (isLocal) return undefined;
  const sourceFile = resolveModule(moduleSpecifier);
  const exportedNode = sourceFile.exports.get(name);
  return findDeclarationOfExportedNode(exportedNode);
}

/**
 * Helper function to find declaration of any
 * exported node.
 *
 * @see findDeclaration
 */
export function findDeclarationOfExportedNode(
  node: ts.ExportNode
): ts.DenoDeclaration | symbol {
  if (ts.isIdentifier(node)) {
    return findDeclaration(node);
  } else if (ts.isExportAssignment(node)) {
    if (ts.isIdentifier(node.expression)) {
      return findDeclaration(node.expression);
    }
    return undefined;
  } else if (ts.isVariableDeclaration(node)) {
    if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      return node;
    }
    if (node.name && ts.isIdentifier(node.name)) {
      return findDeclaration(node.name);
    }
    // In case when we export a constant.
    // const x = ...;
    // export = x;
    return node;
  }
  return node;
}

/**
 * Because node.jsDoc is an internal property in typescript, it migh face
 * some breakig changes in next versions, hence this function should be
 * the only place where we use `node.jsDoc`.
 */
export function getDocumentation(node: ts.Node): types.JSDoc {
  if (ts.isVariableDeclaration(node.parent)) {
    return getDocumentation(node.parent);
  }
  if (ts.isVariableDeclaration(node)) {
    return getDocumentation(node.parent.parent);
  }
  if (node.jsDoc) {
    // TODO(qti3e) Parse jsDoc.
    return node.jsDoc;
  }
  return undefined;
}
