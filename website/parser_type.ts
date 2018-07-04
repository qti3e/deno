// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { registerVisitor } from "./parser";
import * as types from "./types";
import * as util from "./util";

registerVisitor(ts.SyntaxKind.TypeAliasDeclaration, function(
  node: ts.TypeAliasDeclaration,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  // Get definition of this type alias declaration.
  this.visit(node.type, util.keepFirstElement);
  const definition: types.Type = util.keepFirstElement.getData();
  // Get parameters
  const parameters: types.TypeParameter[] = [];
  if (node.typeParameters) {
    for (const p of node.typeParameters) {
      this.visit(p, parameters);
    }
  }
  // Push a new TypeDeclaration to e.
  e.push({
    type: "type",
    documentation,
    name: node.name && node.name.getText(),
    parameters,
    definition
  });
});

registerVisitor(ts.SyntaxKind.TypeReference, function(
  node: ts.TypeReferenceNode,
  e
): void {
  const name = util.parseEntityName(this, node.typeName);
  const fileName = util.getFilename(this, name.identifier);
  const typeArguments: types.Type[] = [];
  if (node.typeArguments) {
    for (const t of node.typeArguments) {
      this.visit(t, typeArguments);
    }
  }
  e.push({
    type: "typeRef",
    fileName,
    name: name.text,
    arguments: typeArguments
  });
});

registerVisitor(ts.SyntaxKind.TypeParameter, function(
  node: ts.TypeParameterDeclaration,
  e
): void {
  this.visit(node.constraint, util.keepFirstElement);
  const constraint = util.keepFirstElement.getData();
  e.push({
    type: "typeParam",
    name: node.name.text,
    constraint
  });
});

registerVisitor(ts.SyntaxKind.ThisType, ts.SyntaxKind.ThisKeyword);

registerVisitor(ts.SyntaxKind.UnionType, function(
  node: ts.UnionTypeNode,
  e
): void {
  const unionTypes: types.Type[] = [];
  for (const t of node.types) {
    this.visit(t, unionTypes);
  }
  e.push({
    type: "unionType",
    types: unionTypes
  });
});

registerVisitor(ts.SyntaxKind.IntersectionType, function(
  node: ts.IntersectionTypeNode,
  e
): void {
  const interTypes: types.Type[] = [];
  for (const t of node.types) {
    this.visit(t, interTypes);
  }
  e.push({
    type: "intersectionType",
    types: interTypes
  });
});

registerVisitor(ts.SyntaxKind.LiteralType, function(
  node: ts.LiteralTypeNode,
  e
): void {
  this.visit(node.literal, e);
});

registerVisitor(ts.SyntaxKind.StringLiteral, function(
  node: ts.StringLiteral,
  e
): void {
  e.push({
    type: "string",
    text: node.text
  });
});

registerVisitor(ts.SyntaxKind.FirstLiteralToken, function(
  node: ts.NumericLiteral,
  e
): void {
  e.push({
    type: "number",
    text: node.text
  });
});

registerVisitor(ts.SyntaxKind.ArrayType, function(
  node: ts.ArrayTypeNode,
  e
): void {
  this.visit(node.elementType, util.keepFirstElement);
  const elementType = util.keepFirstElement.getData();
  e.push({
    type: "arrayType",
    elementType
  });
});

registerVisitor(ts.SyntaxKind.TupleType, function(
  node: ts.TupleTypeNode,
  e
): void {
  const elementTypes: types.Type[] = [];
  for (const t of node.elementTypes) {
    this.visit(t, elementTypes);
  }
  e.push({
    type: "tupleType",
    elementTypes
  });
});

registerVisitor(ts.SyntaxKind.ParenthesizedType, function(
  node: ts.ParenthesizedTypeNode,
  e
): void {
  this.visit(node.type, util.keepFirstElement);
  const elementType = util.keepFirstElement.getData();
  e.push({
    type: "parenthesizedType",
    elementType
  });
});

registerVisitor(ts.SyntaxKind.FunctionType, function(
  node: ts.FunctionTypeNode,
  e
): void {
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
    type: "functionType",
    parameters,
    returnType,
    typeParameters
  });
});

registerVisitor(ts.SyntaxKind.TypeLiteral, function(
  node: ts.TypeLiteralNode,
  e
): void {
  const members: types.TypeElement[] = [];
  for (const m of node.members) {
    this.visit(m, members);
  }
  e.push({
    type: "typeLiteral",
    members
  });
});

registerVisitor(ts.SyntaxKind.IndexSignature, function(
  node: ts.IndexSignatureDeclaration,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  const parameters: types.TypeParameter[] = [];
  for (const p of node.parameters) {
    this.visit(p, parameters);
  }
  this.visit(node.type, util.keepFirstElement);
  const dataType = util.keepFirstElement.getData();
  e.push({
    type: "indexSignature",
    documentation,
    parameters,
    dataType
  });
});

registerVisitor(ts.SyntaxKind.ConstructSignature, function(
  node: ts.ConstructSignatureDeclaration,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  const parameters: types.Parameter[] = [];
  for (const p of node.parameters) {
    this.visit(p, parameters);
  }
  this.visit(node.type, util.keepFirstElement);
  const returnType = util.keepFirstElement.getData();
  e.push({
    type: "constructSignature",
    documentation,
    parameters,
    returnType
  });
});

registerVisitor(ts.SyntaxKind.PropertySignature, function(
  node: ts.PropertySignature,
  e
): void {
  const documentation = util.getDocumentation(this, node);
  // TODO Use same logic for parsing names as q/docs
  const nodeName = node.name;
  let name: ts.Identifier;
  if (ts.isIdentifier(nodeName)) {
    name = name;
  } else if (ts.isComputedPropertyName(nodeName)) {
    const tmp = util.parseComputedPropertyName(this, nodeName);
    name = tmp.identifier;
  }
  const optional = !!node.questionToken;
  this.visit(node.type, util.keepFirstElement);
  const dataType = util.keepFirstElement.getData();
  e.push({
    type: "propertySignature",
    documentation,
    name: name.text,
    optional,
    dataType
  });
});

registerVisitor(ts.SyntaxKind.ConditionalType, function(
  node: ts.ConditionalTypeNode,
  e
): void {
  this.visit(node.checkType, util.keepFirstElement);
  const checkType = util.keepFirstElement.getData();
  this.visit(node.extendsType, util.keepFirstElement);
  const extendsType = util.keepFirstElement.getData();
  this.visit(node.trueType, util.keepFirstElement);
  const trueType = util.keepFirstElement.getData();
  this.visit(node.falseType, util.keepFirstElement);
  const falseType = util.keepFirstElement.getData();
  e.push({
    type: "conditionalType",
    checkType,
    extendsType,
    falseType,
    trueType
  });
});

registerVisitor(ts.SyntaxKind.TypeOperator, function(
  node: ts.TypeOperatorNode,
  e
): void {
  const name: "keyOf" | "unique" =
    node.operator === ts.SyntaxKind.KeyOfKeyword ? "keyOf" : "unique";
  const operator: types.Keyword<"keyOf" | "unique"> = {
    type: "keyword",
    name
  };
  this.visit(node.type, util.keepFirstElement);
  const subject = util.keepFirstElement.getData();
  e.push({
    type: "typeOperator",
    operator,
    subject
  });
});
