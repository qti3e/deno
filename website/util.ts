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
