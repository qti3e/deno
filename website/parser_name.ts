// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.Identifier, function(
  node: ts.Identifier,
  e
): void {
  e.push({
    type: "name",
    ref: node,
    text: node.text
  });
});

registerVisitor(ts.SyntaxKind.ComputedPropertyName, function(
  node: ts.ComputedPropertyName,
  e
): void {
  this.visit(node.expression, e);
});

registerVisitor(ts.SyntaxKind.PropertyAccessExpression, function(
  node: ts.PropertyAccessExpression,
  e
): void {
  const code = this.sourceFile.text.substring(node.pos, node.end);
  // TODO Remove any from here.
  let identifier: any = node;
  while (identifier && !ts.isIdentifier(identifier)) {
    identifier = identifier.expression;
  }
  e.push({
    type: "name",
    ref: identifier,
    text: util.removeSpaces(code)
  });
});

registerVisitor(ts.SyntaxKind.FirstNode, function(
  node: ts.QualifiedName,
  e
): void {
  const code = this.sourceFile.text.substring(node.pos, node.end);
  // TODO Remove any from here.
  let identifier: any = node;
  while (identifier && !ts.isIdentifier(identifier)) {
    identifier = identifier.left;
  }
  e.push({
    type: "name",
    ref: identifier,
    text: util.removeSpaces(code)
  });
});
