// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as types from "./types";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.InterfaceDeclaration, function(
  node: ts.InterfaceDeclaration,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  // Get type parameters
  const parameters: types.TypeParameter[] = [];
  if (node.typeParameters) {
    for (const t of node.typeParameters) {
      this.visit(t, parameters);
    }
  }
  // Get heritageClauses
  const heritageClauses: types.Type[] = [];
  if (node.heritageClauses) {
    for (const h of node.heritageClauses) {
      for (const t of h.types) {
        this.visit(t, heritageClauses);
      }
    }
  }
  // Get members
  const members: types.TypeElement[] = [];
  if (node.members) {
    for (const m of node.members) {
      this.visit(m, members);
    }
  }
  e.push({
    type: "interface",
    name: node.name.text,
    documentation,
    parameters,
    heritageClauses,
    members,
    ...util.getModifiers(node)
  });
});

registerVisitor(ts.SyntaxKind.MethodSignature, function(
  node: ts.MethodSignature | ts.MethodDeclaration,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  this.visit(node.name, util.keepFirstElement);
  const name: types.Name = util.keepFirstElement.getData();
  // assert(name.type, "type");
  const parameters: types.Parameter[] = [];
  for (const p of node.parameters) {
    this.visit(p, parameters);
  }
  this.visit(node.type, util.keepFirstElement);
  const returnType = util.keepFirstElement.getData();
  const typeParameters: types.TypeParameter[] = [];
  if (node.typeParameters) {
    for (const t of node.typeParameters) {
      this.visit(t, typeParameters);
    }
  }
  e.push({
    type: "method",
    documentation,
    name: name && name.text,
    parameters,
    returnType,
    typeParameters,
    optional: !!node.questionToken,
    ...util.getModifiers(node)
  });
});

registerVisitor(ts.SyntaxKind.MethodDeclaration, ts.SyntaxKind.MethodSignature);

registerVisitor(ts.SyntaxKind.ExpressionWithTypeArguments, function(
  node: ts.ExpressionWithTypeArguments,
  e
): void {
  this.visit(node.expression, util.keepFirstElement);
  const expression: types.Name = util.keepFirstElement.getData();
  // assert(name.type, "type");
  const typeArguments: types.Type[] = [];
  if (node.typeArguments) {
    for (const t of node.typeArguments) {
      this.visit(t, typeArguments);
    }
  }
  e.push({
    type: "expressionWithTypeArguments",
    expression: expression && expression.text,
    arguments: typeArguments,
    fileName: util.getFilename(this, expression.ref)
  });
});
