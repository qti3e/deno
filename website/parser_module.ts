// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.SourceFile, function(
  node: ts.SourceFile,
  e
): void {
  if (!this.isJS && !this.isDeclarationFile) {
    // .ts
    const symbol = this.checker.getSymbolAtLocation(node);
    symbol.exports.forEach(value => {
      const node = value.declarations[0];
      this.visit(node, e);
    });
  } else if (this.isDeclarationFile) {
    // .d.ts
  } else {
    // .ts
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
  if (d === -1) return;
  if (!d) {
    // TODO
    // const o = {};
    // e.push(o);
    // const propertyName = node.propertyName || node.name;
    // this.lookForDefinition(propertyName.text, o);
    return;
  }
  this.visit(d, util.keepFirstElement);
  const data = util.keepFirstElement.getData();
  if (!data) return;
  data.name = node.name.text;
  e.push(data);
});
