// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as types from "./types";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.SourceFile, function(
  node: ts.SourceFile | ts.ModuleBlock,
  e
): void {
  if (!this.isJS && !this.isDeclarationFile) {
    // .ts
    let symbol: ts.Symbol;
    if (ts.isSourceFile(node)) {
      symbol = this.checker.getSymbolAtLocation(node);
    } else {
      symbol = this.checker.getSymbolAtLocation(node.parent.name);
    }
    symbol.exports.forEach(value => {
      const node = value.declarations[0];
      this.visit(node, e);
    });
  } else if (this.isDeclarationFile) {
    // .d.ts
  } else {
    // .js
    for (const s of node.statements) {
      if (util.isExported(s)) {
        this.visit(s, e);
      }
    }
  }
});

registerVisitor(ts.SyntaxKind.ExportDeclaration, function(
  node: ts.ExportDeclaration,
  e
): void {
  for (const element of node.exportClause.elements) {
    this.visit(element, e);
  }
});

registerVisitor(ts.SyntaxKind.ExportSpecifier, function(
  node: ts.ExportSpecifier,
  e
): void {
  const d = util.findDeclaration(this, node.propertyName || node.name);
  if (!d) return;
  this.visit(d, util.keepFirstElement);
  const data = util.keepFirstElement.getData();
  if (!data) return;
  data.name = node.name.text;
  e.push(data);
});

registerVisitor(ts.SyntaxKind.ModuleDeclaration, function(
  node: ts.ModuleDeclaration,
  e
): void {
  const body: types.DocEntity[] = [];
  this.visit(node.body, body);
  const name = node.name.text;
  this.currentNamespace.push(name);
  e.push({
    type: "module",
    name: node.name.text,
    body
  });
  this.currentNamespace.pop();
});

registerVisitor(ts.SyntaxKind.ModuleBlock, ts.SyntaxKind.SourceFile);
