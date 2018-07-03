// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { CompilerHost } from "./tshost";
import * as types from "./types";

type VISITOR_CB = (this: Parser, node: ts.Node) => types.SerilizedData;
// ts.SyntaxKind is used when we want to make an alias.
// registerVisitor(ts.SyntaxKind.Foo, ts.SyntaxKind.Bar);
type VISITOR = ts.SyntaxKind | VISITOR_CB;

// Store visitors which are defined by registerVisitor()
const VISITORS = new Map<ts.SyntaxKind, VISITOR>();

/**
 * Register a new visitor
 */
export function registerVisitor(kind: ts.SyntaxKind, cb: VISITOR): void {
  VISITORS.set(kind, cb);
}

/**
 * Parser contains data which are mostly needed by visitors
 * when we call a visitor, it's bound to value that implement
 * this type.
 * So inside a visitor functions, it is accessible thought `this`.
 */
interface Parser {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
  currentNamespace: string[];
  isJS: boolean;
  isDeclarationFile: boolean;
  visit(node: ts.Node): types.SerilizedData;
}

/**
 * Call the right visitor for the given Node based on its
 * kind.
 * Pass a value to `alias` parameter if you want to overwrite
 * node.kind.
 */
function visit(
  this: Parser,
  node: ts.Node,
  alias?: ts.SyntaxKind
): types.SerilizedData {
  const kind = alias ? alias : node.kind;
  const visitor = VISITORS.get(kind);
  if (visitor === undefined) {
    console.log("[%s] is not registered", (ts as any).SyntaxKind[kind], node);
    return;
  }
  if (typeof visitor === "number") {
    return visit.call(this, node, visitor);
  }
  return visitor.call(this, node);
}

/**
 * Extract documentations of the given source code.
 */
export function parse(sourceCode: string, fileName: string): types.DocEntity[] {
  const host = new CompilerHost(sourceCode);
  const options = {};
  const program = ts.createProgram(["deno.ts"], options, host);
  const checker = program.getTypeChecker();
  const sourceFile = program
    .getSourceFiles()
    .filter(x => x.fileName === "deno.ts")[0];
  const parser: Parser = {
    sourceFile,
    checker,
    currentNamespace: [],
    isJS: fileName.endsWith(".js"),
    isDeclarationFile: fileName.endsWith(".d.ts"),
    visit
  };
  parser.visit = visit.bind(parser);
  return visit.call(parser, sourceFile) as types.DocEntity[];
}
