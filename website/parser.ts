// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { CompilerHost } from "./tshost";
import * as types from "./types";

type VISITOR_CB = (
  this: types.Parser,
  node: ts.Node,
  e: types.Pushable<types.SerilizedData>
) => void;
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
 * Call the right visitor for the given Node based on its
 * kind.
 * Pass a value to `alias` parameter if you want to overwrite
 * node.kind.
 */
function visit(
  this: types.Parser,
  node: ts.Node,
  entities: types.Pushable<types.SerilizedData>,
  alias?: ts.SyntaxKind
): void {
  if (!node) return;
  const kind = alias ? alias : node.kind;
  const visitor = VISITORS.get(kind);
  if (visitor === undefined) {
    console.log("[%s] is not registered", (ts as any).SyntaxKind[kind], node);
    return;
  }
  if (typeof visitor === "number") {
    return visit.call(this, node, visitor);
  }
  visitor.call(this, node, entities);
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
  const parser: types.Parser = {
    sourceFile,
    checker,
    currentNamespace: [],
    isJS: fileName.endsWith(".js"),
    isDeclarationFile: fileName.endsWith(".d.ts"),
    visit
  };
  parser.visit = visit.bind(parser);
  const e = [];
  visit.call(parser, sourceFile, e);
  return e as types.DocEntity[];
}

// Import visitors
import "./parser_enum";
import "./parser_function";
import "./parser_interface";
import "./parser_jsdoc";
import "./parser_keyword";
import "./parser_module";
import "./parser_type";
