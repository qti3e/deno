// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as types from "./types";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.ClassDeclaration, function(
  node: ts.ClassDeclaration,
  e
): void {
  const documentation: types.Comment = util.getDocumentation(this, node);
  let parent: types.ExpressionWithTypeArguments;
  const implementsClauses: types.ExpressionWithTypeArguments[] = [];
  if (node.heritageClauses) {
    for (const c of node.heritageClauses) {
      for (const t of c.types) {
        if (c.token === ts.SyntaxKind.ExtendsKeyword) {
          this.visit(t, util.keepFirstElement);
          parent = util.keepFirstElement.getData();
        } else {
          this.visit(t, implementsClauses);
        }
      }
    }
  }
  const typeParameters: types.TypeParameter[] = [];
  if (node.typeParameters) {
    for (const t of node.typeParameters) {
      this.visit(t, typeParameters);
    }
  }
  const members: types.ClassElement[] = [];
  for (const m of node.members) {
    this.visit(m, members);
  }
  e.push({
    type: "class",
    name: node.name && node.name.text,
    documentation,
    parent,
    implementsClauses,
    members,
    typeParameters,
    ...util.getModifiers(node)
  });
});

registerVisitor(ts.SyntaxKind.PropertyDeclaration, function(
  node: ts.PropertyDeclaration,
  e
): void {
  const documentation: types.Comment = util.getDocumentation(this, node);
  this.visit(node.name, util.keepFirstElement);
  const name: types.Name = util.keepFirstElement.getData();
  this.visit(node.type, util.keepFirstElement);
  const dataType = util.keepFirstElement.getData();
  this.visit(node.initializer, util.keepFirstElement);
  const initializer = util.keepFirstElement.getData();
  e.push({
    type: "property",
    documentation,
    name: name && name.text,
    dataType,
    optional: !!node.questionToken,
    initializer,
    ...util.getModifiers(node)
  });
});

registerVisitor(ts.SyntaxKind.Constructor, function(
  node: ts.ConstructorDeclaration,
  e
): void {
  const documentation: types.Comment = util.getDocumentation(this, node);
  const parameters: types.Parameter[] = [];
  for (const p of node.parameters) {
    this.visit(p, parameters);
  }
  this.visit(node.type, util.keepFirstElement);
  const returnType = util.keepFirstElement.getData();
  e.push({
    type: "constructor",
    documentation,
    parameters,
    returnType
  });
});

registerVisitor(ts.SyntaxKind.GetAccessor, function(
  node: ts.GetAccessorDeclaration,
  e
): void {
  const documentation: types.Comment = util.getDocumentation(this, node);
  this.visit(node.type, util.keepFirstElement);
  const returnType: types.Type = util.keepFirstElement.getData();
  this.visit(node.name, util.keepFirstElement);
  const name: types.Name = util.keepFirstElement.getData();
  e.push({
    type: "get",
    name: name && name.text,
    documentation,
    returnType
  });
});

registerVisitor(ts.SyntaxKind.SetAccessor, function(
  node: ts.SetAccessorDeclaration,
  e
): void {
  const documentation: types.Comment = util.getDocumentation(this, node);
  // SetAccessor can only have one parameter.
  this.visit(node.parameters[0], util.keepFirstElement);
  const parameter: types.Parameter = util.keepFirstElement.getData();
  this.visit(node.name, util.keepFirstElement);
  const name: types.Name = util.keepFirstElement.getData();
  e.push({
    type: "set",
    name: name && name.text,
    documentation,
    parameter
  });
});
