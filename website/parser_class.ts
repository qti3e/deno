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
  const members: types.ClassElement = [];
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
