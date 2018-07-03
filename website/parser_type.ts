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