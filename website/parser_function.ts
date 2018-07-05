// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as types from "./types";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.FunctionDeclaration, function(
  node: ts.FunctionDeclaration,
  e
): void {
  // Get documentation.
  const documentation = util.getDocumentation(this, node);
  // Collect parameters.
  const parameters: types.Parameter[] = [];
  for (const p of node.parameters) {
    this.visit(p, parameters);
  }
  // Return type.
  this.visit(node.type, util.keepFirstElement);
  const returnType: types.Type = util.keepFirstElement.getData();
  // Type parameters
  const typeParameters: types.TypeParameter[] = [];
  if (node.typeParameters) {
    for (const p of node.typeParameters) {
      this.visit(p, typeParameters);
    }
  }
  // Return documentation entity.
  e.push({
    type: "function",
    name: node.name && node.name.getText(),
    documentation,
    parameters,
    returnType,
    generator: !!node.asteriskToken,
    typeParameters,
    ...util.getModifiers(node)
  });
});

registerVisitor(ts.SyntaxKind.Parameter, function(
  node: ts.ParameterDeclaration,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  // Get data type.
  this.visit(node.type, util.keepFirstElement);
  const dataType: types.Type = util.keepFirstElement.getData();
  // Parameter is optional when it has question token
  const optional = !!node.questionToken;
  // Return Parameter
  e.push({
    type: "parameter",
    name: node.name && node.name.getText(),
    documentation,
    dataType,
    optional
  });
});
