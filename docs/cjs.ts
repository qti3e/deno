import * as ts from "typescript";
import { findDeclaration } from "./ast";

// This file is to deal with CommonJS modules, and extract
// their exported members in an isolated way.

// We have the following strategy:
// - module.exports = constant;
// const tmp = ts.createVariableDeclaration(..., constant);
// exports.set("export=", tmp);
//
// - module.exports = { a: 3, ... };
// const tmp = ts.createVariableDeclaration(..., 3);
// exports.set("a", tmp);
// ...
//
// - exports.a = function() {}
// const tmp = ts.createVariableDeclaration(..., functionDeclaration);
// exports.set("a", tmp);
//
// - exports.a = {};
// Same as `exports.a = constant`. (For not having a ambiguity.)
//
// - exports.a.b = ...;
// Not supported atm.
//
// - exports = ...;
// Not valid.

export const exportsSym = Symbol();
export const moduleSym = Symbol();

export function extractCJSExports(sourceFile: ts.SourceFile): void {
  for (const node of sourceFile.statements) {
    if (ts.isExpressionStatement(node)) {
      processExport(node, sourceFile);
    }
  }
}

function processExport(
  node: ts.ExpressionStatement,
  sourceFile: ts.SourceFile
): void {
  const expression = node.expression;
  if (!ts.isBinaryExpression(expression)) return;
  const name = getName(expression);
  if (!name) return;
  if (name === "export=") sourceFile.exports.clear();
  const right = expression.right;
  if (ts.isIdentifier(right) ||
      ts.isFunctionExpression(right) ||
      ts.isArrowFunction(right)) {
    sourceFile.exports.set(name, right);
    return;
  }
  switch(right.kind) {
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.NumericLiteral:
      const declaration = ts.createVariableDeclaration(null, null, right);
      const list = ts.createVariableDeclarationList([declaration]);
      const statement = ts.createVariableStatement([], list);
      declaration.scope = sourceFile;
      declaration.parent = list;
      list.scope = sourceFile;
      list.parent = statement;
      statement.scope = sourceFile;
      statement.parent = sourceFile;
      sourceFile.exports.set(name, declaration);
  }
}

function getName(expression: ts.BinaryExpression): string | void {
  const names: Array<string> = [];
  let tmp = expression.left;
  let identifier: ts.Identifier;
  let depth = 0;
  while (tmp) {
    depth++;
    // No need to look too deep.
    if (depth === 4) return;

    if (ts.isIdentifier(tmp)) {
      names.push(tmp.text);
      identifier = tmp;
      break;
    } else if (ts.isPropertyAccessExpression(tmp)) {
      names.push(tmp.name.text);
      tmp = tmp.expression;
    } else if (ts.isElementAccessExpression(tmp)) {
      if (ts.isStringLiteral(tmp.argumentExpression) ||
        ts.isNumericLiteral(tmp.argumentExpression)) {
        names.push(tmp.argumentExpression.text);
      } else {
        return;
      }
    } else {
      // Unsupported expression.
      return;
    }
  }
  names.reverse();
  const declaration = findDeclaration(identifier);
  if (declaration === exportsSym) {
    if (names.length > 2) return;
    return names[1];
  }
  if (declaration === moduleSym) {
    if (names[1] !== "exports") return;
    if (names.length === 2) return "export=";
    if (names.length > 3) return;
    return names[2];
  }
}
