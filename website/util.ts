// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import * as types from "./types";

/**
 * Check if a node is exported.
 */
export function isExported(node: ts.Node): boolean {
  return (
    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
    node.kind === ts.SyntaxKind.ExportDeclaration
  );
}

/**
 * Used when we do not care about data.
 * (think of it as /dev/null)
 */
export const blackholeArray = {
  push() {}
};

/**
 * Used when we only want first element of an array-like.
 */
export const keepFirstElement = {
  data: undefined,
  push(data) {
    if (this.data === undefined) {
      this.data = data;
    }
  },
  getData() {
    const tmp = this.data;
    this.data = undefined;
    return tmp;
  }
};

// TODO It does not work once we support namespace.
export function findDeclaration(
  parser: types.Parser,
  node: ts.Identifier
): ts.Node | 0 | -1 {
  const sourceFile = parser.sourceFile as any;
  if (!sourceFile.locals.has(node.text)) {
    return -1;
  }
  const flowNode = (node as any).flowNode;
  if (
    flowNode.node &&
    flowNode.node.name &&
    flowNode.node.name.text === node.text
  ) {
    return flowNode.node;
  }
  return sourceFile.locals.get(node.text).declarations[0];
}

/**
 * A function that does its best to find documentation comment
 * for a node.
 */
export function getDocumentation(
  parser: types.Parser,
  node
): types.Comment | undefined {
  if (node.jsDoc && node.jsDoc.length > 0) {
    parser.visit(node.jsDoc[0], keepFirstElement);
    return keepFirstElement.getData();
  }
  let s: ts.Symbol | ts.Signature;
  s = parser.checker.getSignatureFromDeclaration(node);
  if (!s && node.name) s = parser.checker.getSymbolAtLocation(node.name);
  if (!s) s = parser.checker.getSymbolAtLocation(node);
  if (s) {
    const doc = s.getDocumentationComment(parser.checker);
    return ts.displayPartsToString(doc);
  }
  return undefined;
}

/**
 * Returns an object containing modifiers of the Node.
 */
export function getModifiers(node: ts.Node): types.Modifiers {
  const ret: types.Modifiers = Object.create(null);
  const flags = ts.getCombinedModifierFlags(node);
  // Get visibility
  if ((flags & ts.ModifierFlags.Public) !== 0) {
    ret.visibility = "public";
  } else if ((flags & ts.ModifierFlags.Protected) !== 0) {
    ret.visibility = "protected";
  } else if ((flags & ts.ModifierFlags.Private) !== 0) {
    ret.visibility = "private";
  }
  if ((flags & ts.ModifierFlags.Async) !== 0) {
    ret.async = true;
  }
  if ((flags & ts.ModifierFlags.Default) !== 0) {
    ret.default = true;
  }
  if ((flags & ts.ModifierFlags.Static) !== 0) {
    ret.static = true;
  }
  if ((flags & ts.ModifierFlags.Readonly) !== 0) {
    ret.readonly = true;
  }
  return ret;
}
