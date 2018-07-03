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
  if (node.name) s = parser.checker.getSymbolAtLocation(node.name);
  if (!s) s = parser.checker.getSymbolAtLocation(node);
  try {
    if (!s) s = parser.checker.getSignatureFromDeclaration(node);
  } catch (e) {}
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

/**
 * Returns file name where given node points to.
 */
export function getFilename(parser: types.Parser, node: ts.Identifier): string {
  // TODO
  // 1. get a node from findDeclaration(parser, node) call it n.
  // 2. if n is any kind of import statements:
  // 3.   return file name of n;
  // 4. else:
  // 5.   return ".";
  return ".#" + node.text;
}

export function parseEntityName(
  parser: types.Parser,
  node: ts.EntityName
): types.ParsedEntityName | undefined {
  if (!ts.isEntityName(node)) return undefined;
  let identifier: ts.EntityName = node;
  while (identifier && !ts.isIdentifier(identifier)) {
    identifier = identifier.left;
  }
  return {
    text: removeSpaces(parser.sourceFile.text.substring(node.pos, node.end)),
    identifier
  } as types.ParsedEntityName;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-white-space
const SPACES = [
  "\u0009", // CHARACTER TABULATION
  "\u000b", // LINE TABULATION
  "\u000c", // FORM FEED (FF)
  "\u0020", // SPACE
  "\u00A0", // NO-BREAK SPACE
  "\uFEFF", // ZERO WIDTH NO-BREAK SPACE
  // Zs: category
  "\u0020", // SPACE
  "\u00A0", // NO-BREAK SPACE
  "\u1680", // OGHAM SPACE MARK
  "\u2000", // EN QUAD
  "\u2001", // EM QUAD
  "\u2002", // EN SPACE
  "\u2003", // EM SPACE
  "\u2004", // THREE-PER-EM SPACE
  "\u2005", // FOUR-PER-EM SPACE
  "\u2006", // SIX-PER-EM SPACE
  "\u2007", // FIGURE SPACE
  "\u2008", // PUNCTUATION SPACE
  "\u2009", // THIN SPACE
  "\u200A", // HAIR SPACE
  "\u202F", // NARROW NO-BREAK SPACE
  "\u205F", // NARROW NO-BREAK SPACE
  "\u3000" // IDEOGRAPHIC SPACE
];

export function isWhiteSpace(c: string): boolean {
  return SPACES.indexOf(c) > -1 || c === "\n";
}

export function removeSpaces(str: string): string {
  let q = null;
  let ret = "";
  let escaped = false;
  for (const c of str) {
    if (c === "\\") escaped = !escaped;
    if (c === "\"" || c === "'" || c === "`") {
      if (!escaped && q === c) {
        q = null;
      } else if (q === null && !escaped) {
        q = c;
      }
      ret += c;
    } else if (q || !(q || isWhiteSpace(c))) {
      ret += c;
    }
    if (c !== "\\") escaped = false;
  }
  return ret;
}
